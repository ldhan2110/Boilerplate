package com.clt.hrm.infra.favorite.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FavoriteDto extends BaseDto {
	private static final long serialVersionUID = 1L;
	private Long favId;
	private String usrId;
	private String pgmCd;
}

