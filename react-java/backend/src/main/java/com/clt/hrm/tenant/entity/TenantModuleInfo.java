package com.clt.hrm.tenant.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Entity class for tenant module information used in validation.
 * Maps to tenant.tent_mdl table.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantModuleInfo {
    private String tenantId;      // TENT_ID
    private String moduleCode;    // MDL_CD
    private String useFlg;        // USE_FLG
    private LocalDate validityFrom; // VLD_FM
    private LocalDate validityTo;   // VLD_TO
}
