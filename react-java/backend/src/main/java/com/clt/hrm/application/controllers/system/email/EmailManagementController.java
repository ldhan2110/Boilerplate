package com.clt.hrm.application.controllers.system.email;

import java.util.List;

import com.clt.hrm.infra.email.dtos.EmailDto;
import com.clt.hrm.infra.email.dtos.EmailDetailDto;
import com.clt.hrm.infra.email.dtos.EmailListResultDto;
import com.clt.hrm.infra.email.dtos.SearchEmailDto;
import com.clt.hrm.infra.email.dtos.SendEmailRequestDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.system.email.EmailManagementServiceResolver;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/sys/email")
@Tag(name = "Email Management", description = "Operations related to email sending management")
public class EmailManagementController {

    @Autowired
    private EmailManagementServiceResolver serviceResolver;

    @PostMapping("/getEmailList")
    public ResponseEntity<EmailListResultDto> getEmailList(@RequestBody SearchEmailDto request) {
        return ResponseEntity.ok(serviceResolver.getService().getEmailList(request));
    }

    @PostMapping("/getEmail")
    public ResponseEntity<EmailDetailDto> getEmail(@RequestBody EmailDto request) {
        return ResponseEntity.ok(serviceResolver.getService().getEmail(request));
    }

    @PostMapping("/resendEmail")
    public ResponseEntity<SuccessDto> resendEmail(@RequestBody EmailDto request) {
        serviceResolver.getService().resendEmail(request);
        return ResponseEntity.ok(SuccessDto.builder().success(true).build());
    }

    @PostMapping("/deleteEmails")
    public ResponseEntity<SuccessDto> deleteEmails(@RequestBody List<EmailDto> request) {
        serviceResolver.getService().deleteEmails(request);
        return ResponseEntity.ok(SuccessDto.builder().success(true).build());
    }

    @PostMapping("/resendEmails")
    public ResponseEntity<SuccessDto> resendEmails(@RequestBody List<EmailDto> request) {
        serviceResolver.getService().resendEmails(request);
        return ResponseEntity.ok(SuccessDto.builder().success(true).build());
    }

    @PostMapping(value = "/sendEmail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SuccessDto> sendEmail(@ModelAttribute SendEmailRequestDto request) {
        serviceResolver.getService().sendEmail(request);
        return ResponseEntity.ok(SuccessDto.builder().success(true).build());
    }
}
