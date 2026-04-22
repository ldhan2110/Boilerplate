package com.clt.hrm.infra.file.dtos;

import org.springframework.web.multipart.MultipartFile;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FileDto extends BaseDto {
    /**
	 * 
	 */
	private static final long serialVersionUID = -7418155782717860878L;
	private String fileId;
    private String fileNm;
    private String filePath;
    private String fileTp;
    private Long fileSz;
    
    // Actual File Content
    private MultipartFile file;
}
