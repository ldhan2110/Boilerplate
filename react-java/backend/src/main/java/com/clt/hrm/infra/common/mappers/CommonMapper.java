package com.clt.hrm.infra.common.mappers;

import org.apache.ibatis.annotations.Mapper;

/**
 * Common Mapper interface
 * Contains reusable SQL fragments for dynamic filtering
 * This interface serves as a marker for MyBatis to recognize the XML mapper namespace
 */
@Mapper
public interface CommonMapper {
	// This mapper only contains SQL fragments (like DynamicFilter)
	// that are included by other mappers using <include refid="..."/>
	// No method definitions are needed here
}
