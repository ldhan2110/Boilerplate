package com.clt.hrm.core.administration.user.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.core.administration.user.dtos.SearchUserDto;
import com.clt.hrm.core.administration.user.dtos.UserInfoDto;

import java.util.List;

@Mapper
public interface AdmUserMapper {
	List<UserInfoDto> searchUserList(SearchUserDto request);
	UserInfoDto selectUserInfo(SearchUserDto request);
	UserInfoDto selectUserById(UserInfoDto request);
	int countUserList(SearchUserDto request);
	void addNewUser(UserInfoDto request);
	void updateUser(UserInfoDto request);
	void resetUserPassword(UserInfoDto user);
	void changeUserPassword(UserInfoDto user);
  void updateUserSetting(UserInfoDto request);
}
