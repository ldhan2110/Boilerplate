package com.clt.hrm.application.controllers.administration.company;

import com.clt.hrm.core.administration.company.dtos.CompanyInfoDto;
import com.clt.hrm.core.administration.company.dtos.CompanyInfoListDto;
import com.clt.hrm.core.administration.company.dtos.SearchCompanyDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.administration.company.AdmCompanyServiceResolver;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/adm/company")
@Tag(name = "Company Management", description = "Operations related to company management")
public class AdmCompanyController {
	@Autowired
	private AdmCompanyServiceResolver serviceResolver;

	@PostMapping("/getListCompanyInfo")
	public ResponseEntity<CompanyInfoListDto> getListCompanyInfo(@Valid @RequestBody SearchCompanyDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getListCompanyInfo(request));
	}

	@PostMapping("/getCompanyInfo")
	public ResponseEntity<CompanyInfoDto> getCompanyInfo(@Valid @RequestBody SearchCompanyDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getCompanyInfo(request));
	}

	@PostMapping("/createCompany")
	public ResponseEntity<SuccessDto> createCompany(@ModelAttribute CompanyInfoDto request) {
		serviceResolver.getService().createCompany(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/updateCompany")
	public ResponseEntity<SuccessDto> updateCompany(@ModelAttribute CompanyInfoDto request) {
		serviceResolver.getService().updateCompany(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
