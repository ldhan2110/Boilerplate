package com.clt.hrm.core.administration.user.interfaces;

import com.clt.hrm.core.administration.user.dtos.ChangeUserInfoDto;
import com.clt.hrm.core.administration.user.dtos.SearchUserDto;
import com.clt.hrm.core.administration.user.dtos.UserInfoDto;
import com.clt.hrm.core.administration.user.dtos.UserInfoListDto;
import com.clt.hrm.infra.export.interfaces.IExcelExportService;

import java.util.List;

public interface IAdmUserService extends IExcelExportService<UserInfoDto, SearchUserDto> {
	UserInfoListDto getListUserInfo(SearchUserDto request);
	UserInfoDto getUserInfo(SearchUserDto request);
	void createUser(UserInfoDto request);
	void updateUser(UserInfoDto request);
	void changeUserInfo(ChangeUserInfoDto request);
	void resetUserPassword(List<UserInfoDto> userList);
	void saveUserSetting(UserInfoDto userInfo);
}
