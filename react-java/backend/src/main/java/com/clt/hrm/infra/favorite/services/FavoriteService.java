package com.clt.hrm.infra.favorite.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.favorite.dtos.FavoriteDto;
import com.clt.hrm.infra.favorite.mappers.FavoriteMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FavoriteService {
	@Autowired
	FavoriteMapper favoriteMapper;

	public List<FavoriteDto> getUserFavorites(String coId, String usrId) {
		FavoriteDto request = new FavoriteDto();
		request.setCoId(coId);
		request.setUsrId(usrId);
		return favoriteMapper.findByUserId(request);
	}

	public boolean isFavorite(String coId, String usrId, String pgmCd) {
		FavoriteDto request = new FavoriteDto();
		request.setCoId(coId);
		request.setUsrId(usrId);
		request.setPgmCd(pgmCd);
		FavoriteDto existing = favoriteMapper.exists(request);
		return existing != null;
	}

	@Transactional(rollbackFor = Exception.class)
	public void addFavorite(String coId, String usrId, String pgmCd) {
		try {
			// Check if already exists
			FavoriteDto request = new FavoriteDto();
			request.setCoId(coId);
			request.setUsrId(usrId);
			request.setPgmCd(pgmCd);
			FavoriteDto existing = favoriteMapper.exists(request);
			
			if (existing != null) {
				throw new BizException("ADM000012", null, "Favorite already exists.", HttpStatus.BAD_REQUEST);
			}

			// Insert new favorite
			favoriteMapper.insert(request);
		} catch (BizException e) {
			throw e;
		} catch (Exception e) {
			log.error("[AdmFavoriteService][addFavorite] Error: {}", e.getMessage(), e);
			throw new BizException("ADM000013", null, "Failed to add favorite: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void removeFavorite(String coId, String usrId, String pgmCd) {
		try {
			FavoriteDto request = new FavoriteDto();
			request.setCoId(coId);
			request.setUsrId(usrId);
			request.setPgmCd(pgmCd);
			favoriteMapper.delete(request);
		} catch (Exception e) {
			log.error("[AdmFavoriteService][removeFavorite] Error: {}", e.getMessage(), e);
			throw new BizException("ADM000014", null, "Failed to remove favorite: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}

