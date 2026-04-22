package com.clt.hrm.infra.report.dtos;

import java.util.HashMap;

import lombok.Data;

@Data
public class GenerateReportDto {
    private String coId;
    private String rptCd;
    private String fileName;
    private HashMap<String, Object> params;
}
