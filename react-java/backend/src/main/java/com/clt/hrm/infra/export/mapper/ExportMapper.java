package com.clt.hrm.infra.export.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.clt.hrm.infra.export.dtos.ExportJobDto;
import com.clt.hrm.infra.export.dtos.SearchExportJobDto;

import jakarta.validation.Valid;

@Mapper
public interface ExportMapper {
	ExportJobDto findJobByJobId(@Param("coId") String coId, @Param("jbId") String jobId);
	void insertExportJob(ExportJobDto job);
	void updateJobStatus(ExportJobDto job);
	List<ExportJobDto> getExportJobList(@Valid SearchExportJobDto request);
	int countExportJobList(@Valid SearchExportJobDto request);
	void updateProgress(@Param("coId") String coId, @Param("jbId") String jbId, @Param("jbProg") int percent);
}
