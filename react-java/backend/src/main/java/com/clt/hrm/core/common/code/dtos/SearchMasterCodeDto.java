package com.clt.hrm.core.common.code.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;

@Data
@EqualsAndHashCode(callSuper=false)	
public class SearchMasterCodeDto extends SearchBaseDto {
	private String mstCd;
	private String mstNm;
	private String mstMdlNm;
}

