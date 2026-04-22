package com.clt.hrm.core.administration.user.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class SearchUserDto extends SearchBaseDto {
    private String usrId;
    private String usrNm;
}
