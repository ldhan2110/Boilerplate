package com.clt.hrm.infra.exceptions.dtos;

import java.util.List;

import lombok.Data;

@Data
public class ExceptionLogListDto {
	List<ExceptionLogDto> messageList;
	int total;
}
