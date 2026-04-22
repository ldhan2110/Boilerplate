package com.clt.hrm.core.administration.program.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PermissionDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = 8061565606941902045L;
	private String pgmId;
	private String permId;
	private String permCd;
	private String permNm;
}

