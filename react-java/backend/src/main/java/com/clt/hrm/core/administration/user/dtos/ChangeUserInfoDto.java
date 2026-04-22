package com.clt.hrm.core.administration.user.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for changing user information and/or password")
public class ChangeUserInfoDto extends UserInfoDto {
	private static final long serialVersionUID = 1L;

	// Password change fields (optional - only required if changing password)
	@Schema(
		description = "Current password (required only when changing password)",
		example = "OldPass@123"
	)
	private String oldPassword;

	@Schema(
		description = "New password (required only when changing password, minimum 8 characters, strong password required)",
		example = "NewPass@123",
		minLength = 8
	)
	@Size(min = 8, message = "Password must be at least 8 characters")
	private String newPassword;

	@Schema(
		description = "Confirmation of the new password (required only when changing password, must match newPassword)",
		example = "NewPass@123"
	)
	private String confirmNewPassword;

	// User avatar file (optional - only required when changing avatar)
	@Schema(
		description = "User avatar image file (optional - only required when changing avatar)",
		hidden = true
	)
	private MultipartFile usrFile;
}

