package com.clt.hrm.core.administration.role.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RoleAuthDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = 7033103627046578138L;
	private String roleId;
    private String pgmId;
    private String permId;
    
    //Optional
    private String pgmCd;
    private String pgmTpCd;
    private String permCd;
    private String activeYn;
}
