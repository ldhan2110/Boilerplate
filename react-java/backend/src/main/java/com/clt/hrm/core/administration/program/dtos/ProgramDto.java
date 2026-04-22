package com.clt.hrm.core.administration.program.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProgramDto extends BaseDto {
	private static final long serialVersionUID = -6288035537005720485L;
	private String pgmId;
    private String pgmCd;
    private String pgmNm;
    private String pgmTpCd;
    private String prntPgmId;
    private String pgmRmk;
    private int dspOrder;
    
    // Tree Structure
    private int level;
    private String treeKey;
    private String treePath;
    
    // Permission List
    List<PermissionDto> permList;
}

