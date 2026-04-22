package com.clt.hrm.infra.common.dtos;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class NotificationDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = -2657014652110039312L;
	private String ntfcTitVal;
	private String ntfcCtntVal;
}
