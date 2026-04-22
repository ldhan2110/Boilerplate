package com.clt.hrm.core.common.code.interfaces;

import com.clt.hrm.core.common.code.dtos.SubCodeDto;

import java.util.List;
import java.util.concurrent.TimeUnit;

public interface IComCodeCacheService {
	List<SubCodeDto> getSubCodesFromCache(String coId, String mstCd);
	void cacheSubCodes(String coId, String mstCd, List<SubCodeDto> subCodes);
	void cacheSubCodes(String coId, String mstCd, List<SubCodeDto> subCodes, long ttl, TimeUnit timeUnit);
	void invalidateSubCodeCacheByMaster(String coId, String mstCd);
	void invalidateAllSubCodeCaches(String coId);
}
