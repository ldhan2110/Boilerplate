package com.clt.hrm.core.administration.role.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoleListDto {
	List<RoleDto> roleList;
	int total;
}
