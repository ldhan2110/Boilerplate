package com.clt.hrm.infra.common.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ByteRangeDto {
	 private long start;
	 private long end;
}
