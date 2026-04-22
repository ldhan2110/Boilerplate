package com.clt.hrm.core.common.code.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.io.Serializable;

/**
 * Lightweight DTO for SubCode response, excluding unnecessary fields
 * to reduce response payload size
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubCodeResponseDto implements Serializable {
	private static final long serialVersionUID = 1L;
	private String coId;
	private String mstCd;
	private String subCd;
	private String subNm;
	private String subDesc;
	private BigDecimal subOrdNo;
	private String attrCtnt1;
	private String attrCtnt2;
	private String attrCtnt3;
	private String attrCtnt4;
	private String attrCtnt5;
	private String attrCtnt6;
	private String attrCtnt7;
	private String attrCtnt8;
	private String attrCtnt9;
	private String attrCtnt10;
	private String attrCtnt11;
	private String attrCtnt12;
	private String attrCtnt13;
	private String attrCtnt14;
	private String attrCtnt15;
	private String attrCtnt16;
	private String attrCtnt17;
	private String attrCtnt18;
	private String attrCtnt19;
	private String attrCtnt20;
	private String dfltFlg;
}

