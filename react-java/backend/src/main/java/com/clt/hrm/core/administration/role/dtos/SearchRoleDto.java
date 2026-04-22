package com.clt.hrm.core.administration.role.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchRoleDto extends SearchBaseDto {
	private String roleId;
    private String roleCd;
    private String roleNm;
    private String pgmId;
    private String permId;
}
