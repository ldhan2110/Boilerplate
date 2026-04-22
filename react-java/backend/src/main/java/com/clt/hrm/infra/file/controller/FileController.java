package com.clt.hrm.infra.file.controller;

import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.utils.CommonFunction;
import com.clt.hrm.tenant.TenantContext;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/com/file")
public class FileController {

	@Autowired
	private FileService fileService;
	
	@PostMapping("/upload")
	public ResponseEntity<SuccessDto> upload(
			@ModelAttribute FileDto file,
			@RequestParam(required = false) String subPath) throws Exception {
		// Use provided subPath or default to UPLOADS
		String path = (subPath != null && !subPath.trim().isEmpty()) ? subPath : FilePathConstants.DEFAULT;
		fileService.saveFile(file, path);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build()); 
	}

	@GetMapping("/download/{fileId}")
	public ResponseEntity<Resource> downloadFile(
			@PathVariable(name="fileId") String fileId,
			@RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
			@RequestParam(name="coId", required = false) String requestedCoId) throws Exception {
		try {
			String coId = (requestedCoId != null && !requestedCoId.trim().isEmpty())
					? requestedCoId
					: CommonFunction.getCompanyId();
			SearchFileDto search = new SearchFileDto();
			search.setCoId(coId);
			search.setFileId(fileId);
			TenantContext.setTenant(coId);
			FileDto file = fileService.getFile(search);

			// If file not found return
			if (file == null) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
			}

			if (rangeHeader == null || rangeHeader.trim().isEmpty()) {
				return fileService.sendFullFile(file);
			}
			return fileService.sendPartialFile(file, rangeHeader);
		} catch (Exception ex) {
			log.error("Error downloading file with ID {}: {}", fileId, ex.getMessage());
			throw ex;
		} finally {
			TenantContext.clear();
		}
	}
}
