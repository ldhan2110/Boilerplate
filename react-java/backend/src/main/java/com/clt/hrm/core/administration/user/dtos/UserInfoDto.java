package com.clt.hrm.core.administration.user.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.file.dtos.FileDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class UserInfoDto extends BaseDto {
	private static final long serialVersionUID = 3244721131774333588L;
	private String usrId;
	private String usrPwd;
    private String usrNm;
    private String usrEml;
    private String roleId;
    private String roleNm;
    private String langVal;
    private String sysModVal;
    private String dtFmtVal;
    private String sysColrVal;
	private String usrPhn;
	private String usrAddr;
	private String usrDesc;
	private String usrFileId;
	private FileDto usrFileDto;
}
