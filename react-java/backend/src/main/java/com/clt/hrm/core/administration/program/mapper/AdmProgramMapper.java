package com.clt.hrm.core.administration.program.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.core.administration.program.dtos.PermissionDto;
import com.clt.hrm.core.administration.program.dtos.ProgramDto;
import com.clt.hrm.core.administration.program.dtos.SearchProgramDto;

@Mapper
public interface AdmProgramMapper {
	List<ProgramDto> searchProgramTreeList(SearchProgramDto request);
	ProgramDto selectProgram(SearchProgramDto request);
	void insertProgram(ProgramDto request);
	void updateProgram(ProgramDto request);
	List<PermissionDto> getPermissionByProgram(ProgramDto request);
	void insertPermission(PermissionDto request);
	void deletePermission(PermissionDto perm);
	void deleteProgram(ProgramDto pgm);
	void updatePermission(PermissionDto perm);
}

