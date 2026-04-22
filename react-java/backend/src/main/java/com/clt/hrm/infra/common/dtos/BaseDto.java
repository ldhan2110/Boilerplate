package com.clt.hrm.infra.common.dtos;

import lombok.Data;

import java.io.Serializable;

@Data
public abstract class BaseDto implements Serializable {
    private static final long serialVersionUID = 2669315884587623955L;
    String coId;
    String creUsrId;
    String updUsrId;
    String creDt;
    String updDt;
    String useFlg;
    String procFlag;
}