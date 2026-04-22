package com.clt.hrm.core.common.code.interfaces;

import com.clt.hrm.core.common.code.dtos.MasterCodeDto;
import com.clt.hrm.core.common.code.dtos.MasterCodeListDto;
import com.clt.hrm.core.common.code.dtos.SearchMasterCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeResponseDto;

import java.util.List;

public interface IComCodeService {
	MasterCodeListDto getListMasterCode(SearchMasterCodeDto request);
	MasterCodeDto getMasterCode(SearchMasterCodeDto request);
	List<List<SubCodeResponseDto>> getCommonCode(String coId, List<String> cdList);
	void saveMasterCode(List<MasterCodeDto> request);
	void saveSubCode(List<SubCodeDto> request);
	void invalidateAllSubCodeCaches(String coId);
}
