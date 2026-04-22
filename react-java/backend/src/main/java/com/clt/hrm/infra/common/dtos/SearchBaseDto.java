package com.clt.hrm.infra.common.dtos;

import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper=false)
public class SearchBaseDto extends BaseDto {
    private String searchText;

    // Dynamic Filter
    List<DynamicFilterDto> filters;
    
    // Pagination & Sorting
    private SortDto sort;
    private List<SortDto> sorts;
    private PaginationDto pagination;
}
