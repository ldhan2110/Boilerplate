package com.clt.hrm.infra.file.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchFileDto {
	private String coId;
	private String fileId;
	private String filePath;
}
