package com.clt.hrm.core.administration.company.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.web.multipart.MultipartFile;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.file.dtos.FileDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class CompanyInfoDto extends BaseDto {
	private static final long serialVersionUID = 1L;
	
	// Basic Information
	private String coId;
	private String coNm;
	private String coTpCd;
	private String coFrgnNm;
	private String taxCd;
	private String taxOfc;
	private String coLoclNm;
	
	// Address
	private String coAddrVal1;
	private String coAddrVal2;
	private String coAddrVal3;
	
	// Contact Information
	private String emlAddr;
	private String faxNo;
	private String phnNo;
	private String slRep;
	private String webAddr;
	
	// Other Information
	private String coDesc;
	private LocalDate coAnvDt;
	private String coSz;
	private String coNtn;
	private String empeSz;
	private String currCd;
	private String coIndusZn;
	private String coProd;
	private String tmZn;

	//Bank Information
	private String bankTpCd;
	private String bankAcctNo;
	private String bankNm;
	private BigDecimal chtrCapiVal;
	private LocalDate estbDt;
	
	// Logo File Reference
	private String lgoFileId;
	
	// Logo File (for uploads - not persisted in DB)
	private MultipartFile logoFile;
	
	// Logo File Info (for response - contains file details)
	private FileDto logoFileDto;
}

