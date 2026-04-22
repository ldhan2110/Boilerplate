package com.clt.hrm.core.common.code.dtos;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Data
public class GetCommonCodeRequestDto {
	@NotBlank(message = "coId is required")
	private String coId;
	
	@NotEmpty(message = "cdList cannot be empty")
	private List<String> cdList;
}

