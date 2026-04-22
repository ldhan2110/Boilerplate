package com.clt.hrm.infra.common.dtos;

import lombok.Data;

@Data
public class PaginationDto {
	private int pageSize;
	private int current;
}
