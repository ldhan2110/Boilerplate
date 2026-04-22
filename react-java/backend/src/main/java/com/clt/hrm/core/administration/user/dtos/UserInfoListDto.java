package com.clt.hrm.core.administration.user.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserInfoListDto {
	List<UserInfoDto> userInfo;
	int total;
}
