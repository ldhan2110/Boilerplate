package com.clt.hrm.core.authentication.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class RoleInfoDto extends BaseDto {
	private String roleId;
	private String roleCd;
	private String roleNm;
	private String roleDesc;

	private List<RoleAuthInfoDto> roleAuthList;
}
