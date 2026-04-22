package com.clt.hrm.infra.exceptions.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchExceptionLogDto extends SearchBaseDto{
	private String dateFm;
	private String dateTo;
	private String endPoint;
}
