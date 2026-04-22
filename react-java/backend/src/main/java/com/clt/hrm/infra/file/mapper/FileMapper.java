package com.clt.hrm.infra.file.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.dtos.FileDto;

@Mapper
public interface FileMapper {
	FileDto findFile(SearchFileDto seach);
    void insertFile(FileDto file);
    void deleteFile(FileDto file);
}
