package com.clt.hrm.core.common.code.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.clt.hrm.core.common.code.dtos.MasterCodeDto;
import com.clt.hrm.core.common.code.dtos.SearchMasterCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeDto;

import java.util.List;

@Mapper
public interface ComCodeMapper {
	List<MasterCodeDto> searchMasterCodeList(SearchMasterCodeDto request);
	int countMasterCodeList(SearchMasterCodeDto request);
	MasterCodeDto getMasterCodeWithSubCodes(SearchMasterCodeDto request);
	List<SubCodeDto> selectSubCodesByMaster(@Param("coId") String coId, @Param("mstCd") String mstCd);
	List<SubCodeDto> selectActiveSubCodesByMaster(@Param("coId") String coId, @Param("mstCd") String mstCd);
	void insertMasterCode(MasterCodeDto request);
	void updateMasterCode(MasterCodeDto request);
	void insertSubCode(SubCodeDto request);
	void updateSubCode(SubCodeDto request);
	void deleteMasterCode(MasterCodeDto request);
	void deleteSubCode(SubCodeDto request);
	void deleteSubCodesByMaster(@Param("coId") String coId, @Param("mstCd") String mstCd);

	// Specials Code
    List<SubCodeDto> selectWorkShiftList(String coId);
	List<SubCodeDto> selectWorkGroupList(String coId);
	List<SubCodeDto> selectWorkLocationList(String coId);
	List<SubCodeDto> selectNationList();
	List<SubCodeDto> selectEthnicList();
	List<SubCodeDto> selectCityList();
	List<SubCodeDto> selectDistrictList();
	List<SubCodeDto> selectReligionList();
    List<SubCodeDto> selectOrgList(String coId);
	List<SubCodeDto> selectAbsenceTypeList(String coId);
	List<SubCodeDto> selectBankList();
	List<SubCodeDto> selectBankBranchList();
	List<SubCodeDto> selectSocialInsuranceOfficeList();
	List<SubCodeDto> selectHospitalList();
	List<SubCodeDto> selectTerminalList(String coId);
	List<SubCodeDto> selectVehicleList(String coId);
}

