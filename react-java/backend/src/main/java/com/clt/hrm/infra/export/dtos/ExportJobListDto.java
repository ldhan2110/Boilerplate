package com.clt.hrm.infra.export.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExportJobListDto {
	List<ExportJobDto> jobs;
	int total;
}
