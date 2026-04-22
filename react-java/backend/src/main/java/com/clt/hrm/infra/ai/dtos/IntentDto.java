package com.clt.hrm.infra.ai.dtos;

import lombok.Data;

@Data
public class IntentDto {
    private String intent;
    private String summary;
    private double confidence;
}
