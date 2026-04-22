package com.clt.hrm.infra.common.dtos;

import jakarta.validation.constraints.Pattern;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

@Data
public class SortDto {
	@JsonPropertyDescription("Sort field. Search by sort field.")
	@Pattern(regexp = "^[A-Za-z0-9_]+$", message = "Invalid SortField")
	private String sortField;

	@JsonPropertyDescription("Sort type. Search by sort type. Values: ASC (Ascending), DESC (Descending)")
	@Pattern(regexp = "ASC|DESC", message = "SortType must be ASC or DESC")
	private String sortType;
}
