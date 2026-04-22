package com.clt.hrm.core.administration.program.interfaces;

import com.clt.hrm.core.administration.program.dtos.PermissionDto;
import com.clt.hrm.core.administration.program.dtos.ProgramDto;
import com.clt.hrm.core.administration.program.dtos.ProgramListDto;
import com.clt.hrm.core.administration.program.dtos.SearchProgramDto;

import java.util.List;

public interface IAdmProgramService {
	ProgramListDto getProgramList(SearchProgramDto request);
	ProgramDto getProgram(SearchProgramDto request);
	void insertProgram(ProgramDto request);
	void updateProgram(ProgramDto request);
	void deleteProgram(List<ProgramDto> request);
	List<PermissionDto> getPermissionByProgram(ProgramDto request);
	void savePermissionByProgram(List<PermissionDto> request);
}
