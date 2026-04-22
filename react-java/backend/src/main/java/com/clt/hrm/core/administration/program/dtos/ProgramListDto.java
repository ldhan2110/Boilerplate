package com.clt.hrm.core.administration.program.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProgramListDto {
	List<ProgramDto> programList;
	int total;
}

