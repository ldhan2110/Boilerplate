package com.clt.hrm.infra.email.services;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.clt.hrm.infra.email.constants.EmailSendStatus;
import com.clt.hrm.infra.email.dtos.EmailAttachmentDetailDto;
import com.clt.hrm.infra.email.dtos.EmailAttachmentDto;
import com.clt.hrm.infra.email.dtos.EmailDetailDto;
import com.clt.hrm.infra.email.dtos.EmailDto;
import com.clt.hrm.infra.email.dtos.EmailListResultDto;
import com.clt.hrm.infra.email.dtos.SearchEmailDto;
import com.clt.hrm.infra.email.dtos.SendEmailRequestDto;
import com.clt.hrm.infra.email.mappers.EmailMapper;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.infra.utils.CommonFunction;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {
    @Autowired
    private EmailMapper emailMapper;

    @Autowired
    private FileService fileService;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    private static final int SYS_MSG_MAX_LENGTH = 1000;

    /**
     * Send email with full options (to, cc, bcc, subject, HTML body, attachments).
     * Addresses in request can be comma-separated (e.g. "a@x.com, b@x.com").
     */
    public void sendEmail(SendEmailRequestDto request) {
        if (request == null || !StringUtils.hasText(request.getTo())) {
            throw new IllegalArgumentException("To address is required");
        }
        List<FileDto> savedFiles = saveAttachments(request.getAttachments());
        EmailDto email = buildEmailDto(request, savedFiles);
        persistEmailAndAttachments(email, savedFiles);
        try {
            doSend(email, request.getSubject(), request.getHtmlContent(), savedFiles);
            updateEmailStatus(email, EmailSendStatus.SUCCESS, "Sent successfully");
        } catch (Exception e) {
            log.error("[EmailService][sendEmail] Send failed for emlId={}", email.getEmlId(), e);
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (msg.length() > SYS_MSG_MAX_LENGTH) {
                msg = msg.substring(0, SYS_MSG_MAX_LENGTH);
            }
            updateEmailStatus(email, EmailSendStatus.ERROR, msg);
            throw new RuntimeException("Email send failed: " + msg, e);
        }
    }

    /**
     * Simple send: one or more to addresses (comma-separated), subject, HTML body. No cc, bcc, or attachments.
     */
    public void sendEmail(String to, String subject, String htmlBody) {
        sendEmail(SendEmailRequestDto.builder()
                .to(to)
                .subject(subject)
                .htmlContent(htmlBody != null ? htmlBody : "")
                .build());
    }

    /**
     * Full send with optional cc, bcc and attachments. Addresses can be comma-separated.
     */
    public void sendEmail(String to, String cc, String bcc, String subject, String htmlBody, List<MultipartFile> attachments) {
        sendEmail(SendEmailRequestDto.builder()
                .to(to)
                .cc(cc)
                .bcc(bcc)
                .subject(subject)
                .htmlContent(htmlBody != null ? htmlBody : "")
                .attachments(attachments != null ? attachments : Collections.emptyList())
                .build());
    }

    public EmailListResultDto getEmailList(SearchEmailDto search) {
        search.setCoId(CommonFunction.getCompanyId());
        EmailListResultDto result = new EmailListResultDto();
        result.setTotal(emailMapper.selectEmailCount(search));
        result.setEmails(emailMapper.selectEmailList(search));
        return result;
    }

    public EmailDetailDto getEmail(EmailDto request) {
        request.setCoId(CommonFunction.getCompanyId());
        EmailDetailDto detail = emailMapper.selectEmail(request);
        if (detail != null && detail.getEmlAtchId() != null) {
            EmailDto atchQuery = new EmailDto();
            atchQuery.setCoId(request.getCoId());
            atchQuery.setEmlAtchId(detail.getEmlAtchId());
            detail.setAttachments(emailMapper.selectEmailAttachments(atchQuery));
        }
        return detail;
    }

    @Transactional(rollbackFor = Exception.class)
    public void resendEmail(EmailDto request) {
        request.setCoId(CommonFunction.getCompanyId());
        EmailDetailDto original = emailMapper.selectEmail(request);
        if (original == null) {
            throw new IllegalArgumentException("Email not found");
        }
        if (!EmailSendStatus.ERROR.name().equals(original.getEmlSndStsCd())) {
            throw new IllegalArgumentException("Only failed emails can be resent");
        }

        String coId = CommonFunction.getCompanyId();
        String usrId = CommonFunction.getUserId();

        // Build new email from original
        EmailDto newEmail = new EmailDto();
        newEmail.setCoId(coId);
        newEmail.setCreUsrId(usrId);
        newEmail.setUpdUsrId(usrId);
        newEmail.setEmlTo(original.getEmlTo());
        newEmail.setEmlCc(original.getEmlCc());
        newEmail.setEmlBcc(original.getEmlBcc());
        newEmail.setEmlSubjVal(original.getEmlSubjVal());
        newEmail.setEmlCntnVal(original.getEmlCntnVal());
        newEmail.setEmlSndStsCd(EmailSendStatus.PENDING.name());

        // Handle attachments
        List<FileDto> existingFiles = new ArrayList<>();
        if (original.getEmlAtchId() != null) {
            EmailDto atchQuery = new EmailDto();
            atchQuery.setCoId(coId);
            atchQuery.setEmlAtchId(original.getEmlAtchId());
            List<EmailAttachmentDetailDto> originalAttachments = emailMapper.selectEmailAttachments(atchQuery);

            if (originalAttachments != null && !originalAttachments.isEmpty()) {
                String newAtchId = emailMapper.selectEmailAttachmentId(coId);
                newEmail.setEmlAtchId(newAtchId);

                for (int i = 0; i < originalAttachments.size(); i++) {
                    EmailAttachmentDetailDto atch = originalAttachments.get(i);
                    SearchFileDto searchFile = new SearchFileDto();
                    searchFile.setCoId(coId);
                    searchFile.setFileId(atch.getFileId());
                    FileDto fileDto = fileService.getFile(searchFile);
                    if (fileDto != null && fileDto.getFilePath() != null) {
                        File file = new File(fileDto.getFilePath());
                        if (file.exists()) {
                            existingFiles.add(fileDto);
                            EmailAttachmentDto newAtch = new EmailAttachmentDto();
                            newAtch.setCoId(coId);
                            newAtch.setCreUsrId(usrId);
                            newAtch.setUpdUsrId(usrId);
                            newAtch.setEmlAtchId(newAtchId);
                            newAtch.setFileId(atch.getFileId());
                            newAtch.setDspOrdVal(i);
                            emailMapper.insertEmailAttachment(newAtch);
                        } else {
                            log.warn("[EmailService][resendEmail] Attachment file not found on disk: {}", fileDto.getFilePath());
                        }
                    }
                }
            }
        }

        // Persist the new email record
        emailMapper.insertEmail(newEmail);

        // Send
        try {
            doSend(newEmail, newEmail.getEmlSubjVal(), newEmail.getEmlCntnVal(), existingFiles);
            updateEmailStatus(newEmail, EmailSendStatus.SUCCESS, "Resent successfully");
        } catch (Exception e) {
            log.error("[EmailService][resendEmail] Resend failed for new emlId={}", newEmail.getEmlId(), e);
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            if (msg.length() > SYS_MSG_MAX_LENGTH) {
                msg = msg.substring(0, SYS_MSG_MAX_LENGTH);
            }
            updateEmailStatus(newEmail, EmailSendStatus.ERROR, msg);
            throw new RuntimeException("Email resend failed: " + msg, e);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteEmails(List<EmailDto> requests) {
        String coId = CommonFunction.getCompanyId();
        for (EmailDto request : requests) {
            request.setCoId(coId);
            EmailDetailDto detail = emailMapper.selectEmail(request);
            if (detail != null) {
                if (detail.getEmlAtchId() != null) {
                    EmailDto atchQuery = new EmailDto();
                    atchQuery.setCoId(coId);
                    atchQuery.setEmlAtchId(detail.getEmlAtchId());
                    emailMapper.deleteEmailAttachments(atchQuery);
                }
                emailMapper.deleteEmail(request);
            }
        }
    }

    public void resendEmails(List<EmailDto> requests) {
        for (EmailDto request : requests) {
            resendEmail(request);
        }
    }

    private List<FileDto> saveAttachments(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return Collections.emptyList();
        }
        List<FileDto> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            FileDto dto = fileService.saveFile(file, FilePathConstants.EMAIL_ATTACHMENT);
            if (dto != null) {
                saved.add(dto);
            }
        }
        return saved;
    }

    private EmailDto buildEmailDto(SendEmailRequestDto request, List<FileDto> savedFiles) {
        String coId = CommonFunction.getCompanyId();
        String usrId = CommonFunction.getUserId();
        EmailDto dto = new EmailDto();
        dto.setCoId(coId);
        dto.setCreUsrId(usrId);
        dto.setUpdUsrId(usrId);
        dto.setEmlTo(normalizeAddresses(request.getTo()));
        dto.setEmlCc(normalizeAddresses(request.getCc()));
        dto.setEmlBcc(normalizeAddresses(request.getBcc()));
        dto.setEmlSubjVal(request.getSubject() != null ? request.getSubject() : "");
        dto.setEmlCntnVal(request.getHtmlContent() != null ? request.getHtmlContent() : "");
        dto.setEmlSndStsCd(EmailSendStatus.PENDING.name());
        dto.setEmlSysMsg(null);
        if (!savedFiles.isEmpty()) {
            dto.setEmlAtchId(emailMapper.selectEmailAttachmentId(coId));
        }
        return dto;
    }

    private static String normalizeAddresses(String addresses) {
        if (addresses == null || addresses.isBlank()) return null;
        return Arrays.stream(addresses.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining(", "));
    }

    private static String[] parseAddresses(String addresses) {
        if (addresses == null || addresses.isBlank()) return new String[0];
        return Arrays.stream(addresses.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
    }

    @Transactional(rollbackFor = Exception.class)
    public void persistEmailAndAttachments(EmailDto email, List<FileDto> savedFiles) {
        if (email.getEmlAtchId() != null && !savedFiles.isEmpty()) {
            String coId = email.getCoId();
            String usrId = email.getCreUsrId();
            for (int i = 0; i < savedFiles.size(); i++) {
                FileDto fd = savedFiles.get(i);
                EmailAttachmentDto atch = new EmailAttachmentDto();
                atch.setCoId(coId);
                atch.setCreUsrId(usrId);
                atch.setUpdUsrId(usrId);
                atch.setEmlAtchId(email.getEmlAtchId());
                atch.setFileId(fd.getFileId());
                atch.setDspOrdVal(i);
                emailMapper.insertEmailAttachment(atch);
            }
            emailMapper.insertEmail(email);
        }
    }

    private void doSend(EmailDto email, String subject, String htmlContent, List<FileDto> attachmentFiles) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        if (StringUtils.hasText(fromAddress)) {
            helper.setFrom(fromAddress);
        }
        String[] to = parseAddresses(email.getEmlTo());
        if (to.length == 0) {
            throw new IllegalArgumentException("No valid To address");
        }
        helper.setTo(to);
        String[] cc = parseAddresses(email.getEmlCc());
        if (cc.length > 0) helper.setCc(cc);
        String[] bcc = parseAddresses(email.getEmlBcc());
        if (bcc.length > 0) helper.setBcc(bcc);
        helper.setSubject(subject != null ? subject : "");
        helper.setText(htmlContent != null ? htmlContent : "", true);
        for (FileDto fileDto : attachmentFiles) {
            File file = new File(fileDto.getFilePath());
            if (file.exists()) {
                String name = StringUtils.hasText(fileDto.getFileNm()) ? fileDto.getFileNm() : "attachment";
                helper.addAttachment(name, new FileSystemResource(file));
            }
        }
        mailSender.send(message);
    }

    private void updateEmailStatus(EmailDto email, EmailSendStatus status, String sysMsg) {
        try {
            email.setEmlSndStsCd(status.name());
            email.setEmlSysMsg(sysMsg);
            email.setUpdUsrId(CommonFunction.getUserId());
            emailMapper.updateEmailStatus(email);
        } catch (Exception e) {
            log.error("[EmailService][updateEmailStatus] Failed to update status for emlId={}", email.getEmlId(), e);
        }
    }
}
