package com.clt.hrm.infra.common.dtos;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DynamicFilterDto {
	@Pattern(regexp = "^[A-Za-z0-9_]+$", message = "Invalid Field")
	private String field; // e.g., "age", "address"
	private String operator; // e.g., "EQUALS", "NOT_EQUALS", "GREATER_THAN"
	private Object value; // e.g., 32, "New York", ["PM", "DEVOPS"]
	private Object valueTo; // e.g., 32, "New York", ["PM", "DEVOPS"]
	private String valueType;
}
