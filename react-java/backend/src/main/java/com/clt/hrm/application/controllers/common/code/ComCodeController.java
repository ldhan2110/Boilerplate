package com.clt.hrm.application.controllers.common.code;

import com.clt.hrm.core.common.code.dtos.GetCommonCodeRequestDto;
import com.clt.hrm.core.common.code.dtos.MasterCodeDto;
import com.clt.hrm.core.common.code.dtos.MasterCodeListDto;
import com.clt.hrm.core.common.code.dtos.SearchMasterCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeDto;
import com.clt.hrm.core.common.code.dtos.SubCodeResponseDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.common.code.ComCodeServiceResolver;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/com/code")
@Tag(name = "Code Management", description = "Operations related to master code and sub code management")
public class ComCodeController {

	@Autowired
	private ComCodeServiceResolver serviceResolver;

	@PostMapping("/getListMasterCode")
	public ResponseEntity<MasterCodeListDto> getListMasterCode(@Valid @RequestBody SearchMasterCodeDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getListMasterCode(request));
	}

	@PostMapping("/getMasterCode")
	public ResponseEntity<MasterCodeDto> getMasterCode(@Valid @RequestBody SearchMasterCodeDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getMasterCode(request));
	}

	@PostMapping("/saveMasterCode")
	public ResponseEntity<SuccessDto> saveMasterCode(@RequestBody List<MasterCodeDto> request) {
		serviceResolver.getService().saveMasterCode(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/saveSubCode")
	public ResponseEntity<SuccessDto> saveSubCode(@RequestBody List<SubCodeDto> request) {
		serviceResolver.getService().saveSubCode(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/getCommonCode")
	public ResponseEntity<List<List<SubCodeResponseDto>>> getCommonCode(@Valid @RequestBody GetCommonCodeRequestDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getCommonCode(request.getCoId(), request.getCdList()));
	}

	@GetMapping("/invalidateSubCodeCache/{coId}")
	public ResponseEntity<SuccessDto> invalidateSubCodeCache(@PathVariable String coId) {
		serviceResolver.getService().invalidateAllSubCodeCaches(coId);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
