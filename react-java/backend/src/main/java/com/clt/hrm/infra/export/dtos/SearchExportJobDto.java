package com.clt.hrm.infra.export.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchExportJobDto extends SearchBaseDto {
	private String jbId;
	private String[] jbIds;
}
