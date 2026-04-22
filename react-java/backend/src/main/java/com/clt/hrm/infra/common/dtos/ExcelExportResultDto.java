package com.clt.hrm.infra.common.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExcelExportResultDto {
    private boolean immediate;
    private byte[] fileData;
    private String fileName;
    private String taskId;
    
    public static ExcelExportResultDto immediate(byte[] data, String fileName) {
        return ExcelExportResultDto.builder()
            .immediate(true)
            .fileData(data)
            .fileName(fileName)
            .build();
    }
    
    public static ExcelExportResultDto async(String taskId) {
        return ExcelExportResultDto.builder()
            .immediate(false)
            .taskId(taskId)
            .build();
    }
}