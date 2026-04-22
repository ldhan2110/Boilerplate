package com.clt.hrm.infra.report.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ReportDto extends BaseDto {
    private static final long serialVersionUID = 1L;
    private String coId;
    private String rptId;
    private String rptCd;
    private String rptNm;
    private String rptFileId;
    private String rptFileName;
    private String pgmId;
    private String pgmNm;
    private String useFlg;
    private String rptUrl;
}
