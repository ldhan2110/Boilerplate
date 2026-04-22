package com.clt.hrm.infra.message.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class SearchMessageDto extends BaseDto {
    /**
     * 
     */
    private static final long serialVersionUID = 1L;
    
    private String msgId;
    private String dfltMsgVal;
    private String mdlNm;
    private String msgTpVal;
    private String langVal;
    
    // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}
