package com.clt.hrm.infra.report.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReportListDto {
    List<ReportDto> reportList;
    int total;
}
