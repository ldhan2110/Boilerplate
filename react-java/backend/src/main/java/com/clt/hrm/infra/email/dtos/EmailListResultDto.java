package com.clt.hrm.infra.email.dtos;

import java.util.List;

import lombok.Data;

@Data
public class EmailListResultDto {
    private List<EmailListDto> emails;
    private int total;
}
