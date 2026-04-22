package com.clt.hrm.infra.favorite.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.infra.favorite.dtos.FavoriteDto;
import com.clt.hrm.infra.favorite.services.FavoriteService;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.utils.CommonFunction;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/favorites")
@Tag(name = "Favorite Management", description = "Operations related to user favorites management")
public class FavoriteController {
	@Autowired
	private FavoriteService service;

	@GetMapping
	public ResponseEntity<List<FavoriteDto>> getUserFavorites() {
		String coId = CommonFunction.getCompanyId();
		String usrId = CommonFunction.getUserId();
		return ResponseEntity.ok(service.getUserFavorites(coId, usrId));
	}

	@PostMapping
	public ResponseEntity<SuccessDto> addFavorite(@RequestBody FavoriteDto request) {
		String coId = CommonFunction.getCompanyId();
		String usrId = CommonFunction.getUserId();
		service.addFavorite(coId, usrId, request.getPgmCd());
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@DeleteMapping("/{pgmCd}")
	public ResponseEntity<SuccessDto> removeFavorite(@PathVariable String pgmCd) {
		String coId = CommonFunction.getCompanyId();
		String usrId = CommonFunction.getUserId();
		service.removeFavorite(coId, usrId, pgmCd);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}

