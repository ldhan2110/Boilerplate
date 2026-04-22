package com.clt.hrm.publicApi.terminal.mapper;

import com.clt.hrm.publicApi.terminal.dtos.ActiveTerminalConfigDto;
import com.clt.hrm.publicApi.terminal.dtos.UpdateTerminalStatusDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PublicTerminalMapper {

    List<ActiveTerminalConfigDto> selectActiveTerminalConfigs();

    ActiveTerminalConfigDto selectTerminalConfigByTmlId(@Param("tmlId") String tmlId);

    void updateTerminalStatus(UpdateTerminalStatusDto dto);

    String resolveEmpeIdByTmlUsrId(@Param("coId") String coId, @Param("tmlUsrId") String tmlUsrId);

    int insertAttendanceLog(@Param("coId") String coId, @Param("empeId") String empeId,
                            @Param("checkTm") String checkTm, @Param("tmlId") String tmlId);
}
