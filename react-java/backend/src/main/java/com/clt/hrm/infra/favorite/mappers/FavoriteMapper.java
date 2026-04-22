package com.clt.hrm.infra.favorite.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.infra.favorite.dtos.FavoriteDto;

@Mapper
public interface FavoriteMapper {
	List<FavoriteDto> findByUserId(FavoriteDto request);
	void insert(FavoriteDto request);
	void delete(FavoriteDto request);
	FavoriteDto exists(FavoriteDto request);
}

