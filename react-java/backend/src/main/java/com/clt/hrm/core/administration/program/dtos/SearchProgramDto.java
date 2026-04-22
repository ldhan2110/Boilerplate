package com.clt.hrm.core.administration.program.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchProgramDto extends SearchBaseDto{
	private String pgmId;
	private String pgmCd;
    private String pgmNm;
    private String pgmTpCd;
}

