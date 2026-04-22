package com.clt.hrm.core.administration.user.service;

import com.clt.hrm.core.administration.user.dtos.*;
import com.clt.hrm.core.administration.user.mapper.AdmUserMapper;
import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.core.authentication.service.AuthCacheService;
import com.clt.hrm.infra.export.dtos.ExportJobDto;
import com.clt.hrm.core.administration.user.interfaces.IAdmUserService;
import com.clt.hrm.infra.export.service.ExportExcelService;
import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.extern.slf4j.Slf4j;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdmUserService implements IAdmUserService {
	@Autowired
	AdmUserMapper userMapper;

	@Autowired
	PasswordEncoder passwordEncoder;
	
	@Autowired
	ExportExcelService excelService;

	@Autowired(required = false)
	AuthCacheService authCacheService;

	@Autowired(required = false)
	FileService fileService;

	@Value("${default.password}")
	private String defaultPassword;

	private static final String PASSWORD_PATTERN =  "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";

	public UserInfoListDto getListUserInfo(SearchUserDto request) {
		if (request.getFilters() != null && request.getFilters().size() > 0) {
			try {
				List<DynamicFilterDto> filterList = request.getFilters().stream()
						.map(filter -> CommonFunction.convertFilterValue(filter)).collect(Collectors.toList());
				request.setFilters(filterList);
			} catch (IllegalArgumentException e) {
				log.error("[AdmUserService][getListUserInfo] Error: {}", e.getMessage(), e);
				request.setFilters(null);
			}
		}

		UserInfoListDto result = new UserInfoListDto();
		result.setUserInfo(userMapper.searchUserList(request));
		result.setTotal(userMapper.countUserList(request));
		return result;
	}

	public UserInfoDto getUserInfo(SearchUserDto request) {
		UserInfoDto user = userMapper.selectUserInfo(request);
		if (user == null) {
			return null;
		}
		// If user avatar file ID exists, fetch file details
		if (user.getUsrFileId() != null && !user.getUsrFileId().trim().isEmpty()) {
			try {
				com.clt.hrm.infra.file.dtos.SearchFileDto fileSearch = new com.clt.hrm.infra.file.dtos.SearchFileDto();
				fileSearch.setCoId(user.getCoId());
				fileSearch.setFileId(user.getUsrFileId());
				FileDto fileDto = fileService.getFile(fileSearch);
				if (fileDto != null) {
					user.setUsrFileDto(fileDto);
				}
			} catch (Exception e) {
				log.warn("[AdmUserService][getUserInfo] Error fetching avatar file: {}", e.getMessage());
				// Don't fail the request if file fetch fails
			}
		}
		return user;
	}

	@Transactional(rollbackFor = Exception.class)
	public void createUser(UserInfoDto request) {
		final String usrId = CommonFunction.getUserId();
		UserInfoDto existUser = userMapper.selectUserById(request);
		if (existUser != null) {
			throw new BizException("ADM000001", null, "User already exists.", HttpStatus.BAD_REQUEST);
		}
		try {
			request.setUsrPwd(passwordEncoder.encode(defaultPassword));
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			userMapper.addNewUser(request);
		} catch (Exception e) {
			log.error("[AdmUserService][createUser] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void updateUser(UserInfoDto request) {
		final String usrId = CommonFunction.getUserId();
		UserInfoDto existUser = userMapper.selectUserById(request);
		if (existUser == null) {
			throw new BizException("ADM000002", null, "User does not exists.", HttpStatus.BAD_REQUEST);
		}
		try {
			request.setUpdUsrId(usrId);
			userMapper.updateUser(request);

			// If REDIS available, invalidate user cache info
			if (authCacheService != null) {
				String username = request.getCoId().concat("::").concat(request.getUsrId());
				authCacheService.invalidateUserCache(username);
				authCacheService.logoutAllDevices(username);
			}
		} catch (Exception e) {
			log.error("[AdmUserService][updateUser] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void resetUserPassword(List<UserInfoDto> userList) {
		try {
			if (userList.isEmpty()) {
				throw new BizException("ADM000003", null, "No User to Update", HttpStatus.BAD_REQUEST);
			}

			UserInfo usr = CommonFunction.getUserInfo();
			String updUsrId = usr.getUsrId();
			String encodedDefault = passwordEncoder.encode(defaultPassword);

			List<UserInfoDto> updatedUser = userList.stream().map(user -> {
				user.setUpdUsrId(updUsrId);
				user.setUsrPwd(encodedDefault);
				return user;
			}).collect(Collectors.toList());

			for (UserInfoDto user : updatedUser) {
				userMapper.resetUserPassword(user);
			}
		} catch (BizException e) {
			log.error("[AdmUserService.resetPassword] {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			log.error("[AdmUserService.resetPassword] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void changeUserInfo(ChangeUserInfoDto request) {
		final String currentUsrId = CommonFunction.getUserId();

		// 1. Validate user exists
		UserInfoDto existingUser = validateUserExists(request);

		// 2. Set audit fields
		request.setUpdUsrId(currentUsrId);
		preserveUseFlgIfNeeded(request, existingUser);

		try {

			// 3. Handle password change if requested
			boolean passwordChanged = handlePasswordChangeIfRequested(request, existingUser, currentUsrId);

			// 4. Handle avatar update/delete
			handleAvatarUpdate(request, existingUser, currentUsrId);

			// 5. Update user basic information
			userMapper.updateUser(request);

			// 6. Invalidate cache
			invalidateCacheAndSessionsIfNeeded(request, passwordChanged);

		} catch (BizException e) {
			log.error("[changeUserInfo] Business error for user {}: {}", request.getUsrId(), e.getMessage());
			throw e;
		} catch (Exception e) {
			log.error("[changeUserInfo] Unexpected error for user {}: {}", request.getUsrId(), e.getMessage(), e);
			throw new BizException("ADM000027", null, "Failed to update user information", HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

// ==================== PRIVATE HELPER METHODS ====================

	/**
	 * Validate that user exists in database
	 */
	private UserInfoDto validateUserExists(ChangeUserInfoDto request) {
		UserInfoDto existingUser = userMapper.selectUserById(request);
		if (existingUser == null) {
			throw new BizException("ADM000002", null, "User does not exist", HttpStatus.BAD_REQUEST);
		}
		return existingUser;
	}

	/**
	 * Preserve existing useFlg if not provided in request
	 */
	private void preserveUseFlgIfNeeded(ChangeUserInfoDto request, UserInfoDto existingUser) {
		if (request.getUseFlg() == null) {
			request.setUseFlg(existingUser.getUseFlg());
		}
	}

	/**
	 * Handle password change if any password field is provided
	 * @return true if password was changed, false otherwise
	 */
	private boolean handlePasswordChangeIfRequested(ChangeUserInfoDto request, UserInfoDto existingUser, String currentUsrId) {
		if (!isPasswordChangeRequested(request)) {
			return false;
		}

		// Validate all password fields
		validatePasswordChangeFields(request);

		// Verify current password
		if (!passwordEncoder.matches(request.getOldPassword(), existingUser.getUsrPwd())) {
			throw new BizException("ADM000025", null, "Current password is incorrect", HttpStatus.BAD_REQUEST);
		}

		// Verify new password matches confirmation
		if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
			throw new BizException("ADM000018", null, "New password and confirm password do not match", HttpStatus.BAD_REQUEST);
		}

		// Validate password policy (strength, length, etc.)
		validatePasswordPolicy(request.getNewPassword());

		// Update password in database
		existingUser.setUsrPwd(passwordEncoder.encode(request.getNewPassword()));
		existingUser.setUpdUsrId(currentUsrId);
		userMapper.changeUserPassword(existingUser);

		log.info("[handlePasswordChange] Password changed for user: {}", request.getUsrId());
		return true;
	}

	/**
	 * Check if password change is requested
	 */
	private boolean isPasswordChangeRequested(ChangeUserInfoDto request) {
		return isNotEmpty(request.getOldPassword()) ||
				isNotEmpty(request.getNewPassword()) ||
				isNotEmpty(request.getConfirmNewPassword());
	}

	/**
	 * Validate all password change fields are provided
	 */
	private void validatePasswordChangeFields(ChangeUserInfoDto request) {
		if (isEmpty(request.getOldPassword())) {
			throw new BizException("ADM000022", null, "Current password is required", HttpStatus.BAD_REQUEST);
		}
		if (isEmpty(request.getNewPassword())) {
			throw new BizException("ADM000023", null, "New password is required", HttpStatus.BAD_REQUEST);
		}
		if (isEmpty(request.getConfirmNewPassword())) {
			throw new BizException("ADM000024", null, "Confirm password is required", HttpStatus.BAD_REQUEST);
		}
	}

	/**
	 * Handle avatar file upload, update, or deletion
	 */
	private void handleAvatarUpdate(ChangeUserInfoDto request, UserInfoDto existingUser, String currentUsrId) {
		boolean isClearAvatarRequest = isClearAvatarRequest(request);

		// Case 1: New avatar file uploaded
		if (request.getUsrFile() != null && !request.getUsrFile().isEmpty()) {
			handleAvatarUpload(request, existingUser, currentUsrId);
		}
		// Case 2: Explicit clear avatar request
		else if (isClearAvatarRequest) {
			handleAvatarClear(request, existingUser);
		}
		// Case 3: Keep existing avatar if FE didn't send usrFileId
		else if (request.getUsrFileId() == null) {
			request.setUsrFileId(existingUser.getUsrFileId());
		}
	}

	/**
	 * Check if this is a clear avatar request (empty string sent)
	 */
	private boolean isClearAvatarRequest(ChangeUserInfoDto request) {
		return request.getUsrFile() == null &&
				request.getUsrFileId() != null &&
				request.getUsrFileId().trim().isEmpty();
	}

	/**
	 * Upload new avatar and delete old one
	 */
	private void handleAvatarUpload(ChangeUserInfoDto request, UserInfoDto existingUser, String currentUsrId) {
		// Delete old avatar if exists (non-blocking)
		deleteOldAvatarIfExists(request.getCoId(), existingUser.getUsrFileId());

		// Upload new avatar (blocking - must succeed)
		String newFileId = uploadAvatarFile(request.getUsrFile(), request.getCoId(), currentUsrId);
		request.setUsrFileId(newFileId);

		log.info("[handleAvatarUpload] New avatar saved with ID: {}", newFileId);
	}

	/**
	 * Clear avatar by deleting file and setting field to empty
	 */
	private void handleAvatarClear(ChangeUserInfoDto request, UserInfoDto existingUser) {
		// Delete old avatar (non-blocking)
		deleteOldAvatarIfExists(request.getCoId(), existingUser.getUsrFileId());

		// Keep empty string so mapper can set NULL
		request.setUsrFileId("");

		log.info("[handleAvatarClear] Avatar cleared for user: {}", request.getUsrId());
	}

	/**
	 * Delete old avatar file if exists (non-blocking operation)
	 */
	private void deleteOldAvatarIfExists(String coId, String oldFileId) {
		if (isEmpty(oldFileId)) {
			return;
		}

		try {
			SearchFileDto fileSearch = new SearchFileDto();
			fileSearch.setCoId(coId);
			fileSearch.setFileId(oldFileId);

			FileDto oldFile = fileService.getFile(fileSearch);
			if (oldFile != null) {
				fileService.deleteFile(oldFile);
				log.info("[deleteOldAvatar] Deleted old avatar: {}", oldFileId);
			}
		} catch (Exception e) {
			// Non-blocking: log warning but don't fail the transaction
			log.warn("[deleteOldAvatar] Failed to delete old avatar {}: {}", oldFileId, e.getMessage());
		}
	}

	/**
	 * Upload avatar file and return file ID (blocking operation)
	 */
	private String uploadAvatarFile(MultipartFile multipartFile, String coId, String usrId) {
		Path tempFile = null;

		try {
			// Create temporary file
			tempFile = Files.createTempFile("user_avatar_", "_" + multipartFile.getOriginalFilename());
			multipartFile.transferTo(tempFile.toFile());

			// Save to file service
			FileDto savedFile = fileService.saveFile(tempFile.toFile(), coId, usrId, FilePathConstants.USER_AVATAR);

			if (savedFile == null || savedFile.getFileId() == null) {
				throw new BizException("ADM000026", null, "Failed to save avatar file - service returned null", HttpStatus.INTERNAL_SERVER_ERROR);
			}

			return savedFile.getFileId();

		} catch (BizException e) {
			throw e;
		} catch (Exception e) {
			String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
			log.error("[uploadAvatarFile] Error: {}", errorMsg, e);
			throw new BizException("ADM000026", null, "Failed to save avatar file: " + errorMsg, HttpStatus.INTERNAL_SERVER_ERROR);
		} finally {
			// Clean up temporary file
			cleanupTempFile(tempFile);
		}
	}

	/**
	 * Clean up temporary file
	 */
	private void cleanupTempFile(Path tempFile) {
		if (tempFile != null) {
			try {
				Files.deleteIfExists(tempFile);
			} catch (IOException e) {
				log.warn("[cleanupTempFile] Failed to delete temp file: {}", e.getMessage());
			}
		}
	}

	/**
	 * Invalidate user cache and logout all devices if password changed
	 */
	private void invalidateCacheAndSessionsIfNeeded(ChangeUserInfoDto request, boolean passwordChanged) {
		if (authCacheService == null) {
			log.warn("[invalidateCache] AuthCacheService is not available");
			return;
		}

		try {
			String username = request.getCoId() + "::" + request.getUsrId();

			// Always invalidate user cache
			authCacheService.invalidateUserCache(username);
			log.debug("[invalidateCache] User cache invalidated: {}", username);

			// Only logout all devices if password was changed
			if (passwordChanged) {
				authCacheService.logoutAllDevices(username);
				log.info("[invalidateCache] All devices logged out for user: {}", username);
			}

		} catch (Exception e) {
			// Non-blocking: log error but don't fail the transaction
			log.error("[invalidateCache] Failed to invalidate cache for user {}: {}",
					request.getUsrId(), e.getMessage());
		}
	}

// ==================== UTILITY METHODS ====================

	private boolean isEmpty(String str) {
		return str == null || str.trim().isEmpty();
	}

	private boolean isNotEmpty(String str) {
		return !isEmpty(str);
	}

	@Transactional(rollbackFor = Exception.class)
	public void saveUserSetting(UserInfoDto userInfo) {
		final String usrId = CommonFunction.getUserId();
		try {
			userInfo.setUpdUsrId(usrId);
			userMapper.updateUserSetting(userInfo);
		} catch (Exception e) {
			log.error("[AdmUserService][saveUserSetting] Error: {}", e.getMessage(), e);
			throw e;
		}
	}
	

	@Override
	public void writeExcelData(Workbook workbook, SearchUserDto filter, ExportJobDto job) {
		Sheet sheet = workbook.createSheet("Users");
		
		// Create header style
		CellStyle headerStyle = workbook.createCellStyle();
		Font headerFont = workbook.createFont();
		headerFont.setBold(true);
		headerFont.setFontHeightInPoints((short) 12);
		headerStyle.setFont(headerFont);
		headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
		headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

		// Border
		headerStyle.setBorderTop(BorderStyle.THIN);
		headerStyle.setBorderBottom(BorderStyle.THIN);
		headerStyle.setBorderLeft(BorderStyle.THIN);
		headerStyle.setBorderRight(BorderStyle.THIN);

		// Optional border color
		headerStyle.setTopBorderColor(IndexedColors.BLACK.getIndex());
		headerStyle.setBottomBorderColor(IndexedColors.BLACK.getIndex());
		headerStyle.setLeftBorderColor(IndexedColors.BLACK.getIndex());
		headerStyle.setRightBorderColor(IndexedColors.BLACK.getIndex());

		// Create header row
		Row headerRow = sheet.createRow(0);
		String[] columns = { "User ID", "Full Name", "Role", "Email", "Status", "Created Date", "Created By", "Updated Date", "Updated By" };

		for (int i = 0; i < columns.length; i++) {
			Cell cell = headerRow.createCell(i);
			cell.setCellValue(columns[i]);
			cell.setCellStyle(headerStyle);
		}

		List<UserInfoDto> users = userMapper.searchUserList(filter);

		// Create data rows
		// Create cell style
		CellStyle style = workbook.createCellStyle();

		// Border
		style.setBorderTop(BorderStyle.THIN);
		style.setBorderBottom(BorderStyle.THIN);
		style.setBorderLeft(BorderStyle.THIN);
		style.setBorderRight(BorderStyle.THIN);

		// Optional border color
		style.setTopBorderColor(IndexedColors.BLACK.getIndex());
		style.setBottomBorderColor(IndexedColors.BLACK.getIndex());
		style.setLeftBorderColor(IndexedColors.BLACK.getIndex());
		style.setRightBorderColor(IndexedColors.BLACK.getIndex());
		
		long processed = 0;
		int rowNum = 1;
		for (UserInfoDto user : users) {
			Row row = sheet.createRow(rowNum++);

		    Cell cell0 = row.createCell(0);
		    cell0.setCellValue(user.getUsrId());
		    cell0.setCellStyle(style);

		    Cell cell1 = row.createCell(1);
		    cell1.setCellValue(user.getUsrNm());
		    cell1.setCellStyle(style);

		    Cell cell2 = row.createCell(2);
		    cell2.setCellValue(user.getRoleNm());
		    cell2.setCellStyle(style);

		    Cell cell3 = row.createCell(3);
		    cell3.setCellValue(user.getUsrEml());
		    cell3.setCellStyle(style);
		    
		    Cell cell4 = row.createCell(4);
		    cell4.setCellValue(user.getUseFlg().equals("Y") ? "Active" : "Inactive");
		    cell4.setCellStyle(style);

		    Cell cell5 = row.createCell(5);
		    cell5.setCellValue(user.getCreDt().toString());
		    cell5.setCellStyle(style);

		    Cell cell6 = row.createCell(6);
		    cell6.setCellValue(user.getCreUsrId());
		    cell6.setCellStyle(style);

		    Cell cell7 = row.createCell(7);
		    cell7.setCellValue(user.getUpdDt().toString());
		    cell7.setCellStyle(style);
		    
		    Cell cell8 = row.createCell(8);
		    cell8.setCellValue(user.getUpdUsrId());
		    cell8.setCellStyle(style);
		    
		    processed++;
		    
		    if (job != null && (processed % 100 == 0 || processed == job.getTotalRows())) {
		        int percent = (int) ((processed * 100.0) / job.getTotalRows());
		        excelService.updateProgress(job.getCoId(), job.getJbId(), percent);
		        log.info("Progress: {}%", percent);
		       
		    }
		}
	}

	@Override
	public int countExportData(SearchUserDto filter) {
		return userMapper.countUserList(filter);
	}

	private void validatePasswordPolicy(String password) {
    if (!password.matches(PASSWORD_PATTERN)) {
        throw new BizException(
                "ADM000004",
                null,
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
                HttpStatus.BAD_REQUEST
        );
    }
	}
}
