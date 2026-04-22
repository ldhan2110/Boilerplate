package com.clt.hrm.infra.email.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchEmailDto extends BaseDto {
    private String fromDate;
    private String toDate;
    private String emlSndStsCd;
    private String emlTo;
    private String emlSubjVal;
    /** Optional contains filter for EML_SYS_MSG (used for idempotency keys). */
    private String emlSysMsg;
    /**
     * Exact-prefix filter for EML_SYS_MSG (e.g. "key=PAYSLIP|").
     * Used by batch dispatch queries to avoid full-table-scan LIKE '%...%'.
     */
    private String sysMsgPrefix;
    /**
     * List of status codes for IN-clause queries (batch dispatch / recovery).
     * e.g. ["QUEUED"] or ["PROCESSING"].
     */
    private List<String> statuses;
    /** Batch size limit for dispatch SELECT queries. */
    private Integer batchSize;
    /** Stale-threshold in minutes for crash-recovery queries. */
    private Integer staleMinutes;
    /**
     * List of full sysMsg key strings for bulk idempotency check.
     * e.g. ["key=PAYSLIP|..."].
     * Used by selectProcessedSysMsgs to do a single IN-query instead of N SELECTs.
     */
    private List<String> sysMsgs;
    private List<DynamicFilterDto> filters;
    private SortDto sort;
    private PaginationDto pagination;
}
