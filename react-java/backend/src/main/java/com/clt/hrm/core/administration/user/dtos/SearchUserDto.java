package com.clt.hrm.core.administration.user.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;

@Data
public class SearchUserDto {
    private String coId;
    private String usrId;
    private String usrNm;
    private String useFlg;
    
    // Dynamic Filter
    List<DynamicFilterDto> filters;
    
    // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}
