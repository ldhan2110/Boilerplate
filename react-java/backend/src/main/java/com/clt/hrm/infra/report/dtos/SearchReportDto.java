package com.clt.hrm.infra.report.dtos;

import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;
import lombok.Data;

@Data
public class SearchReportDto {
    private String coId;
    private String rptId;
    private String rptCd;
    private String rptNm;
    private String pgmId;
    private String pgmCd;
    private String useFlg;
    private String textSearch;
    
    private SortDto sort;
    private PaginationDto pagination;
}
