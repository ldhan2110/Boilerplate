package com.clt.hrm.core.common.code.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.fasterxml.jackson.databind.JsonNode;

@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class MasterCodeDto extends BaseDto {
	private static final long serialVersionUID = 1L;
	private String mstCd;
	private String mstNm;
	private String mstMdlNm;
	private String mstDesc;
	private JsonNode subTblCfg;
	private List<SubCodeDto> subCodes;
}

