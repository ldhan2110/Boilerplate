package com.clt.hrm.infra.report.mappers;

import com.clt.hrm.infra.report.dtos.ReportDto;
import com.clt.hrm.infra.report.dtos.SearchReportDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportMapper {
    List<ReportDto> selectReportList(SearchReportDto request);
    int countReportList(SearchReportDto request);
    ReportDto getReport(SearchReportDto request);
    int checkDuplicateReportCode(SearchReportDto request);
    void insertReport(ReportDto request);
    void updateReport(ReportDto request);
    void deleteReport(@Param("coId") String coId, @Param("rptCdList") String[] rptCdList);
}
