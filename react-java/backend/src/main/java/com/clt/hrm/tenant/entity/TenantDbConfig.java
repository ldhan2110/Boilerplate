package com.clt.hrm.tenant.entity;

import com.clt.hrm.infra.common.dtos.BaseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class TenantDbConfig extends BaseDto {
    private static final long serialVersionUID = 1L;
    
    private String tenantId;  // Company ID (CO_ID) - Primary Key
    private String dbType;    // Database type (postgres, mysql, oracle)
    private String dbHost;    // Database host
    private Integer dbPort;   // Database port
    private String dbName;    // Database name
    private String dbUsername; // Database username
    private String dbPassword; // Database password (encrypted)
}
