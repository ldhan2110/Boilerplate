package com.clt.hrm.core.common.code.service;

import com.clt.hrm.core.common.code.dtos.MasterCodeDto;
import com.clt.hrm.core.common.code.dtos.MasterCodeListDto;
import com.clt.hrm.core.common.code.dtos.SearchMasterCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeResponseDto;
import com.clt.hrm.core.common.code.interfaces.IComCodeService;
import com.clt.hrm.core.common.code.mapper.ComCodeMapper;
import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.utils.CommonFunction;
import com.clt.hrm.tenant.TenantContext;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ComCodeService implements IComCodeService {

	@Autowired
	private ComCodeMapper comCodeMapper;

	@Autowired(required = false)
	private ComCodeCacheService comCodeCacheService;

	@Autowired(required = false)
	@Qualifier("codeQueryExecutor")
	private Executor codeQueryExecutor;

	public void invalidateAllSubCodeCaches(String coId) {
		if (comCodeCacheService != null) {
			comCodeCacheService.invalidateAllSubCodeCaches(coId);
		}
	}

	public MasterCodeListDto getListMasterCode(SearchMasterCodeDto request) {
		// Get company ID from user context
		String coId = CommonFunction.getUserInfo().getCoId();
		request.setCoId(coId);

		// Process dynamic filters
		if (request.getFilters() != null && request.getFilters().size() > 0) {
			try {
				List<DynamicFilterDto> filterList = request.getFilters().stream()
						.map(filter -> CommonFunction.convertFilterValue(filter))
						.collect(Collectors.toList());
				request.setFilters(filterList);
			} catch (IllegalArgumentException e) {
				log.error("[ComCodeService][getListMasterCode] Error: {}", e.getMessage(), e);
				request.setFilters(null);
			}
		}

		MasterCodeListDto result = new MasterCodeListDto();
		result.setMasterCodes(comCodeMapper.searchMasterCodeList(request));
		result.setTotal(comCodeMapper.countMasterCodeList(request));
		return result;
	}

	public MasterCodeDto getMasterCode(SearchMasterCodeDto request) {
		// Get company ID from user context
		String coId = CommonFunction.getUserInfo().getCoId();
		request.setCoId(coId);

		MasterCodeDto masterCode = comCodeMapper.getMasterCodeWithSubCodes(request);

		if (masterCode != null) {
			// Load sub codes
			List<SubCodeDto> subCodes = comCodeMapper.selectSubCodesByMaster(coId, masterCode.getMstCd());
			masterCode.setSubCodes(subCodes);
		}

		return masterCode;
	}

	/**
	 * Get common codes for multiple master codes
	 * Returns List<List<SubCodeResponseDto>> maintaining the order of cdList
	 * Uses async execution internally for parallel queries
	 * Returns lightweight response DTO excluding unnecessary fields
	 */
	public List<List<SubCodeResponseDto>> getCommonCode(String coId, List<String> cdList) {
		if (cdList == null || cdList.isEmpty()) {
			return new ArrayList<>();
		}

		try {
			// Ensure tenant context is set before async operations
			// This ensures the TaskDecorator can capture it for propagation
			if (coId != null && !coId.trim().isEmpty() && !TenantContext.hasTenant()) {
				TenantContext.setTenant(coId);
				log.debug("[ComCodeService][getCommonCode] Tenant context set to: {}", coId);
			}

			// Create CompletableFuture for each master code query
			List<CompletableFuture<List<SubCodeDto>>> futures = cdList.stream()
					.map(mstCd -> getSubCodesAsync(coId, mstCd))
					.collect(Collectors.toList());

			// Wait for all futures, convert to response DTOs, and collect results in order
			return futures.stream()
					.map(future -> convertToResponseDto(future.join()))
					.collect(Collectors.toList());
		} catch (Exception e) {
			log.error("[ComCodeService][getCommonCode] Error getting common codes: coId={}, cdList={}", coId, cdList,
					e);
			throw new BizException("COM_CODE_0003", null, "Error retrieving common codes: " + e.getMessage(),
					HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Convert SubCodeDto list to SubCodeResponseDto list, excluding unnecessary
	 * fields
	 */
	private List<SubCodeResponseDto> convertToResponseDto(List<SubCodeDto> subCodes) {
		if (subCodes == null) {
			return new ArrayList<>();
		}
		return subCodes.stream()
				.map(this::convertToResponseDto)
				.collect(Collectors.toList());
	}

	/**
	 * Convert single SubCodeDto to SubCodeResponseDto
	 */
	private SubCodeResponseDto convertToResponseDto(SubCodeDto dto) {
		SubCodeResponseDto response = new SubCodeResponseDto();
		response.setCoId(dto.getCoId());
		response.setMstCd(dto.getMstCd());
		response.setSubCd(dto.getSubCd());
		response.setSubNm(dto.getSubNm());
		response.setSubDesc(dto.getSubDesc());
		response.setSubOrdNo(dto.getSubOrdNo());
		response.setAttrCtnt1(dto.getAttrCtnt1());
		response.setAttrCtnt2(dto.getAttrCtnt2());
		response.setAttrCtnt3(dto.getAttrCtnt3());
		response.setAttrCtnt4(dto.getAttrCtnt4());
		response.setAttrCtnt5(dto.getAttrCtnt5());
		response.setAttrCtnt6(dto.getAttrCtnt6());
		response.setAttrCtnt7(dto.getAttrCtnt7());
		response.setAttrCtnt8(dto.getAttrCtnt8());
		response.setAttrCtnt9(dto.getAttrCtnt9());
		response.setAttrCtnt10(dto.getAttrCtnt10());
		response.setAttrCtnt11(dto.getAttrCtnt11());
		response.setAttrCtnt12(dto.getAttrCtnt12());
		response.setAttrCtnt13(dto.getAttrCtnt13());
		response.setAttrCtnt14(dto.getAttrCtnt14());
		response.setAttrCtnt15(dto.getAttrCtnt15());
		response.setAttrCtnt16(dto.getAttrCtnt16());
		response.setAttrCtnt17(dto.getAttrCtnt17());
		response.setAttrCtnt18(dto.getAttrCtnt18());
		response.setAttrCtnt19(dto.getAttrCtnt19());
		response.setAttrCtnt20(dto.getAttrCtnt20());
        response.setDfltFlg(dto.getDfltFlg());
		return response;
	}

	/**
	 * Get sub codes for a single master code (async, with caching)
	 */
	private CompletableFuture<List<SubCodeDto>> getSubCodesAsync(String coId, String mstCd) {
		if (codeQueryExecutor != null) {
			return CompletableFuture.supplyAsync(() -> {
				return fetchSubCodes(coId, mstCd);
			}, codeQueryExecutor);
		} else {
			return CompletableFuture.supplyAsync(() -> {
				return fetchSubCodes(coId, mstCd);
			});
		}
	}

	/**
	 * Fetch sub codes from cache or DB
	 */
	public List<SubCodeDto> fetchSubCodes(String coId, String mstCd) {
		try {
			// Check cache first if available
			if (comCodeCacheService != null) {
				List<SubCodeDto> cached = comCodeCacheService.getSubCodesFromCache(coId, mstCd);
				if (cached != null) {
					log.debug("[ComCodeService] Cache hit for coId={}, mstCd={}", coId, mstCd);
					return cached;
				}
			}

			// Query from DB (only active sub codes for getCommonCode)
			List<SubCodeDto> subCodes;
			switch (mstCd) {
				case "WRK_SHFT":
					subCodes = comCodeMapper.selectWorkShiftList(coId);
					break;
				case "WRK_GROUP":
					subCodes = comCodeMapper.selectWorkGroupList(coId);
					break;
				case "WRK_LOC":
					subCodes = comCodeMapper.selectWorkLocationList(coId);
					break;
				case "NATION":
					subCodes = comCodeMapper.selectNationList();
					break;
				case "ETHNIC":
					subCodes = comCodeMapper.selectEthnicList();
					break;
				case "CITY":
					subCodes = comCodeMapper.selectCityList();
					break;
				case "DISTRICT":
					subCodes = comCodeMapper.selectDistrictList();
					break;
				case "RELIGION":
					subCodes = comCodeMapper.selectReligionList();
					break;
				case "ORGANIZATION":
					subCodes = comCodeMapper.selectOrgList(coId);
					break;
				case "BANK":
					subCodes = comCodeMapper.selectBankList();
					break;
				case "BANK_BRANCH":
					subCodes = comCodeMapper.selectBankBranchList();
					break;
				case "SI_OFFICE":
					subCodes = comCodeMapper.selectSocialInsuranceOfficeList();
					break;
				case "HOSPITAL":
					subCodes = comCodeMapper.selectHospitalList();
					break;
				case "ABS_ENT_TP":
					subCodes = comCodeMapper.selectAbsenceTypeList(coId);
					break;
				case "VEHICLE":
					subCodes = comCodeMapper.selectVehicleList(coId);
					break;
				case "TERMINAL_CD":
					subCodes = comCodeMapper.selectTerminalList(coId);
					break;
				case "CURRENCY":
					// For CURRENCY, map subCd to subNm so that subCd becomes the label
					subCodes = comCodeMapper.selectActiveSubCodesByMaster(coId, mstCd);
					if (subCodes != null) {
						subCodes = subCodes.stream()
								.peek(subCode -> {
									// Set subNm to subCd for CURRENCY codes
									subCode.setSubNm(subCode.getSubCd());
								})
								.collect(Collectors.toList());
					}
					break;
				case "PRD_TP":
					// Period Type: only keep rows with attrCtnt3 = null or '0'
					subCodes = comCodeMapper.selectActiveSubCodesByMaster(coId, mstCd);
					if (subCodes != null) {
						subCodes = subCodes.stream()
								.filter(subCode -> {
									String attr3 = subCode.getAttrCtnt3();
									if (attr3 == null) {
										return true;
									}
									String trimmed = attr3.trim();
									return trimmed.isEmpty() || "0".equals(trimmed);
								})
								.collect(Collectors.toList());
					}
					break;
				case "PRD_TP_ALL":
					// Period Type (ALL): load all active PRD_TP sub codes, without attrCtnt3 filtering
					subCodes = comCodeMapper.selectActiveSubCodesByMaster(coId, "PRD_TP");
					break;
				default:
					subCodes = comCodeMapper.selectActiveSubCodesByMaster(coId, mstCd);
					break;
			}
			if (subCodes == null) {
				subCodes = new ArrayList<>();
			}

			// Cache if available
			if (comCodeCacheService != null) {
				comCodeCacheService.cacheSubCodes(coId, mstCd, subCodes);
				log.debug("[ComCodeService] Cached sub codes for coId={}, mstCd={}", coId, mstCd);
			}

			return subCodes;
		} catch (Exception e) {
			log.error("[ComCodeService][fetchSubCodes] Error getting sub codes: coId={}, mstCd={}", coId, mstCd, e);
			return new ArrayList<>();
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void saveMasterCode(List<MasterCodeDto> request) {
		if (request == null || request.size() == 0) {
			throw new BizException("COM000008", null, "Cannot Process Empty Array.", HttpStatus.BAD_REQUEST);
		}

		try {
			final String usrId = CommonFunction.getUserId();
			final String coId = CommonFunction.getUserInfo().getCoId();

			List<MasterCodeDto> deletedMasterCodeList = request.stream()
					.filter(r -> "D".equals(r.getProcFlag()))
					.collect(Collectors.toList());
			for (MasterCodeDto masterCode : deletedMasterCodeList) {
				masterCode.setCoId(coId);
				// Delete all sub codes first
				comCodeMapper.deleteSubCodesByMaster(coId, masterCode.getMstCd());
				// Delete master code
				comCodeMapper.deleteMasterCode(masterCode);
			}

			List<MasterCodeDto> modifiedMasterCodeList = request.stream()
					.filter(r -> !"D".equals(r.getProcFlag()))
					.collect(Collectors.toList());
			for (MasterCodeDto masterCode : modifiedMasterCodeList) {
				masterCode.setCoId(coId);
				masterCode.setCreUsrId(usrId);
				masterCode.setUpdUsrId(usrId);
				switch (masterCode.getProcFlag()) {
					case "I":
						// Check if master code already exists
						SearchMasterCodeDto search = new SearchMasterCodeDto();
						search.setCoId(coId);
						search.setMstCd(masterCode.getMstCd());
						MasterCodeDto existing = comCodeMapper.getMasterCodeWithSubCodes(search);
						if (existing != null) {
							throw new BizException("COM_CODE_0001", null, "Master code already exists.",
									HttpStatus.BAD_REQUEST);
						}
						comCodeMapper.insertMasterCode(masterCode);
						break;
					case "U":
						// Check if master code exists
						SearchMasterCodeDto searchUpdate = new SearchMasterCodeDto();
						searchUpdate.setCoId(coId);
						searchUpdate.setMstCd(masterCode.getMstCd());
						MasterCodeDto existingUpdate = comCodeMapper.getMasterCodeWithSubCodes(searchUpdate);
						if (existingUpdate == null) {
							throw new BizException("COM_CODE_0002", null, "Master code does not exist.",
									HttpStatus.BAD_REQUEST);
						}
						comCodeMapper.updateMasterCode(masterCode);
						break;
				}
			}
		} catch (BizException e) {
			log.error("[ComCodeService][saveMasterCode] Business error: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			log.error("[ComCodeService][saveMasterCode] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void saveSubCode(List<SubCodeDto> request) {
		if (request == null || request.size() == 0) {
			throw new BizException("COM000008", null, "Cannot Process Empty Array.", HttpStatus.BAD_REQUEST);
		}

		try {
			final String usrId = CommonFunction.getUserId();
			final String coId = CommonFunction.getUserInfo().getCoId();

			// Track affected master codes for cache invalidation
			Set<String> affectedMasterCodes = request.stream()
					.map(SubCodeDto::getMstCd)
					.collect(Collectors.toSet());

			List<SubCodeDto> deletedSubCodeList = request.stream()
					.filter(r -> "D".equals(r.getProcFlag()))
					.collect(Collectors.toList());
			for (SubCodeDto subCode : deletedSubCodeList) {
				subCode.setCoId(coId);
				comCodeMapper.deleteSubCode(subCode);
			}

			List<SubCodeDto> modifiedSubCodeList = request.stream()
					.filter(r -> !"D".equals(r.getProcFlag()))
					.collect(Collectors.toList());
			for (SubCodeDto subCode : modifiedSubCodeList) {
				subCode.setCoId(coId);
				subCode.setCreUsrId(usrId);
				subCode.setUpdUsrId(usrId);
				switch (subCode.getProcFlag()) {
					case "I":
						comCodeMapper.insertSubCode(subCode);
						break;
					case "U":
						comCodeMapper.updateSubCode(subCode);
						break;
				}
			}

			// Invalidate cache for affected master codes
			if (comCodeCacheService != null && !affectedMasterCodes.isEmpty()) {
				for (String mstCd : affectedMasterCodes) {
					comCodeCacheService.invalidateSubCodeCacheByMaster(coId, mstCd);
				}
				log.debug("[ComCodeService][saveSubCode] Invalidated cache for {} master code(s)",
						affectedMasterCodes.size());
			}
		} catch (Exception e) {
			log.error("[ComCodeService][saveSubCode] Error: {}", e.getMessage(), e);
			throw e;
		}
	}
}
