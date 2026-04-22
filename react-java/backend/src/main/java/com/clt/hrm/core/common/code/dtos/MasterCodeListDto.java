package com.clt.hrm.core.common.code.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MasterCodeListDto {
	List<MasterCodeDto> masterCodes;
	int total;
}

