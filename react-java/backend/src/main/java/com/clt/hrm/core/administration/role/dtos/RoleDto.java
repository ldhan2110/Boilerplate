package com.clt.hrm.core.administration.role.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleDto extends BaseDto {
    /**
	 * 
	 */
	private static final long serialVersionUID = -6288035537005720485L;
	private String roleId;
    private String roleCd;
    private String roleNm;
    private String roleDesc;
    List<RoleAuthDto> roleAuthList;
}
