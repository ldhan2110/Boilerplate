package com.clt.hrm.infra.report.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchReportDto extends SearchBaseDto {
    private String rptId;
    private String rptCd;
    private String rptNm;
    private String pgmId;
    private String pgmCd;
    private String textSearch;
}
