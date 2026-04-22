package com.clt.hrm.infra.exceptions.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.infra.exceptions.dtos.ExceptionLogDto;
import com.clt.hrm.infra.exceptions.dtos.SearchExceptionLogDto;

@Mapper
public interface ExceptionLogMapper {
	void persistLogError(ExceptionLogDto errorLog);

	void persistBatchLogError(List<ExceptionLogDto> list);

	List<ExceptionLogDto> searchMessageHistoryList(SearchExceptionLogDto request);

	void cleanupLog(String coId);
}
