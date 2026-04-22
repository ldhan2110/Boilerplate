package com.clt.hrm.infra.email.dtos;

import java.util.List;
import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchEmailDto extends SearchBaseDto {
    private String fromDate;
    private String toDate;
    private String emlSndStsCd;
    private String emlTo;
    private String emlSubjVal;
    private String emlSysMsg;
    private String sysMsgPrefix;
    private List<String> statuses;
    private Integer batchSize;
    private Integer staleMinutes;
    private List<String> sysMsgs;
}
