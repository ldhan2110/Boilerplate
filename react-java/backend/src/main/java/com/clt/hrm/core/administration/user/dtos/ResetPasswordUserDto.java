package com.clt.hrm.core.administration.user.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for changing a user's password")
public class ResetPasswordUserDto {

    @Schema(
        description = "User ID whose password will be changed",
        example = "USR00123"
    )
    @NotBlank
    private String usrId;

    @Schema(
        description = "Company ID of the user",
        example = "COMP01"
    )
    @NotBlank
    private String coId;

    @Schema(
        description = "Current password of the user",
        example = "OldPass@123"
    )
    @NotBlank
    private String oldPassword;

    @Schema(
        description = "New password (minimum 8 characters, strong password required)",
        example = "NewPass@123",
        minLength = 8
    )
    @NotBlank
    @Size(min = 8)
    private String newPassword;

    @Schema(
        description = "Confirmation of the new password (must match newPassword)",
        example = "NewPass@123"
    )
    @NotBlank
    private String confirmNewPassword;
}
