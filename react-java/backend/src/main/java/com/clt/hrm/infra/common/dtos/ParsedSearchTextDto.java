package com.clt.hrm.infra.common.dtos;

import lombok.Data;

import java.util.List;

@Data
public class ParsedSearchTextDto {

    private final List<String> codeList;
    private final List<String> nameList;
}
