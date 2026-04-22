package com.clt.hrm.application.controllers.administration.user;

import com.clt.hrm.core.administration.user.dtos.ChangeUserInfoDto;
import com.clt.hrm.core.administration.user.dtos.SearchUserDto;
import com.clt.hrm.core.administration.user.dtos.UserInfoDto;
import com.clt.hrm.core.administration.user.dtos.UserInfoListDto;
import com.clt.hrm.infra.common.dtos.ExcelExportResultDto;
import com.clt.hrm.application.resolvers.administration.user.AdmUserServiceResolver;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.export.service.ExportExcelService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/adm/user")
@Tag(name = "User Management", description = "Operations related to user management")
public class AdmUserController {
	@Autowired
	private AdmUserServiceResolver serviceResolver;

	@Autowired
	private ExportExcelService excelService;

	@PostMapping("/getListUserInfo")
	public ResponseEntity<UserInfoListDto> getListUserInfo(@Valid @RequestBody SearchUserDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getListUserInfo(request));
	}

	@PostMapping("/getUserInfo")
	public ResponseEntity<UserInfoDto> getUserInfo(@Valid @RequestBody SearchUserDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getUserInfo(request));
	}

	@PostMapping("/createUser")
	public ResponseEntity<SuccessDto> createUser(@RequestBody UserInfoDto request) {
		serviceResolver.getService().createUser(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/updateUser")
	public ResponseEntity<SuccessDto> updateUser(@RequestBody UserInfoDto request) {
		serviceResolver.getService().updateUser(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/resetUserPassword")
	public ResponseEntity<SuccessDto> resetUserPassword(@RequestBody List<UserInfoDto> userList) {
		serviceResolver.getService().resetUserPassword(userList);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/changeUserInfo")
	@Operation(
		summary = "Change user information and/or password",
		description = "Update user basic information and/or change password. Password fields are optional - only required when changing password. Supports multipart/form-data for avatar upload."
	)
	public ResponseEntity<SuccessDto> changeUserInfo(@Valid @ModelAttribute ChangeUserInfoDto request) {
		serviceResolver.getService().changeUserInfo(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/saveUserSetting")
	public ResponseEntity<SuccessDto> saveUserSetting(@RequestBody UserInfoDto userInfo) {
		serviceResolver.getService().saveUserSetting(userInfo);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("/exportExcel")
	public ResponseEntity<?> exportExcel(@Valid @RequestBody SearchUserDto request) throws Exception {
		int count = serviceResolver.getService().countExportData(request);
		ExcelExportResultDto result;
		try {
			String fileName = "user_list_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
			result = excelService.export(serviceResolver.getService(), count, request, 10000, fileName);
			if (result.isImmediate()) {
				return ResponseEntity.ok()
						.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.getFileName() + "\"")
						.contentType(MediaType.APPLICATION_OCTET_STREAM).body(result.getFileData());
			}
            
            return ResponseEntity.accepted()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
}
