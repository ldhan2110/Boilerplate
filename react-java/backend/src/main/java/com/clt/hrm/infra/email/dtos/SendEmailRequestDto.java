package com.clt.hrm.infra.email.dtos;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending email. Addresses can be comma-separated (e.g. "a@x.com, b@x.com").
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendEmailRequestDto {
    /** To recipients (comma-separated or single address). */
    private String to;
    /** Cc recipients (optional, comma-separated). */
    private String cc;
    /** Bcc recipients (optional, comma-separated). */
    private String bcc;
    /** Email subject. */
    private String subject;
    /** HTML body content. */
    private String htmlContent;
    /** Optional attachments. */
    private List<MultipartFile> attachments;
}
