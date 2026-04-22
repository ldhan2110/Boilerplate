package com.clt.hrm.tenant.mapper;

import com.clt.hrm.tenant.entity.TenantDbConfig;
import com.clt.hrm.tenant.entity.TenantModuleInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * Unified mapper for all tenant-related database operations.
 * Consolidates operations from TenantServiceImplMapper and TenantDbConfigMapper.
 */
@Mapper
public interface TenantServiceMapper {
    String getServiceBeanName(@Param("tenantId") String tenantId, @Param("serviceCode") String serviceCode);
    TenantDbConfig selectTenantDbConfig(String tenantId);
    TenantModuleInfo selectModuleInfo(@Param("tenantId") String tenantId, @Param("moduleCode") String moduleCode);
    boolean isTenantActive(String tenantId);
}
