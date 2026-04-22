package com.clt.hrm.publicApi.terminal.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecordAttendanceLogResultDto {
    private int inserted;
    private int duplicates;
    private int failed;
    private int skipped;
}
