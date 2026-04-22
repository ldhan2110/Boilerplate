package com.clt.hrm.core.administration.role.dtos;

import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;

@Data
public class SearchRoleDto {
	private String coId;
	private String roleId;
    private String roleCd;
    private String roleNm;
    private String pgmId;
    private String permId;
    private String useFlg;
    
    // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}
