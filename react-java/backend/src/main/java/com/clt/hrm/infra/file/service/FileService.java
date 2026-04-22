package com.clt.hrm.infra.file.service;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.common.dtos.ByteRangeDto;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.mapper.FileMapper;
import com.clt.hrm.infra.common.streams.LimitedInputStream;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class FileService {
	@Value("${file.upload-dir}")
	private String UPLOAD_DIR;

	@Autowired
	private FileMapper fileMapper;

	public FileDto getFile(SearchFileDto search) {
		FileDto file = fileMapper.findFile(search);

		if ((file == null || !fileExists(file)) && search != null) {
			boolean hasExplicitCoId = search.getCoId() != null && !search.getCoId().trim().isEmpty();

			// Retry lookup without company filter to support legacy files stored under different company IDs
			if (hasExplicitCoId && (search.getFileId() != null || search.getFilePath() != null)) {
				SearchFileDto fallbackSearch = new SearchFileDto();
				fallbackSearch.setFileId(search.getFileId());
				fallbackSearch.setFilePath(search.getFilePath());
				file = fileMapper.findFile(fallbackSearch);
			}
		}

		if (file == null || !fileExists(file)) {
			return null;
		}
		return file;
	}

	public ResponseEntity<Resource> sendFullFile(FileDto file) throws IOException {
		File fileContent = new File(file.getFilePath());
		InputStreamResource resource = new InputStreamResource(new FileInputStream(fileContent));
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileNm() + "\"")
				.header(HttpHeaders.ACCEPT_RANGES, "bytes").contentType(MediaType.APPLICATION_OCTET_STREAM)
				.contentLength(file.getFileSz()).body(resource);
	}

	public ResponseEntity<Resource> sendPartialFile(FileDto file, String rangeHeader) throws IOException {
		List<ByteRangeDto> ranges = parseRangeHeader(rangeHeader, file.getFileSz());
		if (ranges.isEmpty()) {
			return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
					.header(HttpHeaders.CONTENT_RANGE, "bytes */" + file.getFileSz()).build();
		}
		ByteRangeDto range = ranges.get(0);
		long start = range.getStart();
		long end = range.getEnd();
		long contentLength = end - start + 1;

		InputStream inputStream = new FileInputStream(file.getFilePath());
		inputStream.skip(start);

		LimitedInputStream limitedStream = new LimitedInputStream(inputStream, contentLength);
		InputStreamResource resource = new InputStreamResource(limitedStream);

		return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileNm() + "\"")
				.header(HttpHeaders.ACCEPT_RANGES, "bytes")
				.header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + file.getFileSz())
				.header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
				.contentType(MediaType.APPLICATION_OCTET_STREAM).body(resource);
	}

	private List<ByteRangeDto> parseRangeHeader(String rangeHeader, long fileSize) {
		List<ByteRangeDto> ranges = new ArrayList<>();
		Pattern pattern = Pattern.compile("bytes=(\\d+)-(\\d*)");
		Matcher matcher = pattern.matcher(rangeHeader);

		if (matcher.find()) {
			try {
				long start = Long.parseLong(matcher.group(1));
				String endStr = matcher.group(2);
				long end = endStr.isEmpty() ? fileSize - 1 : Long.parseLong(endStr);

				if (start >= 0 && start < fileSize && end >= start && end < fileSize) {
					ranges.add(new ByteRangeDto(start, end));
				}
			} catch (NumberFormatException e) {
				log.error("[FileService][parseRangeHeader] Error parsing range header: {}", rangeHeader, e);
			}
		}
		return ranges;
	}

	/**
	 * Save file from FileDto with default sub-path (uploads)
	 * 
	 * @param fileDto the file DTO containing file information
	 * @return the updated FileDto with saved file information, or null if failed
	 */
	@Transactional(rollbackFor = Exception.class)
	public FileDto saveFile(FileDto fileDto) {
		return saveFile(fileDto, FilePathConstants.DEFAULT);
	}

	/**
	 * Save file from FileDto with specified sub-path
	 * 
	 * @param fileDto the file DTO containing file information
	 * @param subPath the sub-path constant (e.g., FilePathConstants.EMPLOYEE_IMAGE, FilePathConstants.CONTRACT)
	 * @return the updated FileDto with saved file information, or null if failed
	 */
	@Transactional(rollbackFor = Exception.class)
	public FileDto saveFile(FileDto fileDto, String subPath) {
		if (fileDto == null || fileDto.getFile() == null || fileDto.getFile().isEmpty()) {
			log.warn("[FileService][saveFile]: FileDto or MultipartFile is null or empty");
			return null;
		}

		MultipartFile file = fileDto.getFile();

		// Get companyId from user context
		UserInfo user = CommonFunction.getUserInfo();
		String companyId = user.getCoId();
		
		// Use default sub-path if not specified
		if (subPath == null || subPath.trim().isEmpty()) {
			subPath = FilePathConstants.DEFAULT;
		}

		// Build multi-tenant directory path: {root}/{companyId}/{subPath}
		String directory = buildCompanyDirectory(companyId, subPath);

		// Ensure directory exists
		if (!checkDirectory(directory)) {
			return null;
		}

		try {
			// Get original filename and extension
			String originalFilename = file.getOriginalFilename();
			if (originalFilename != null) {
				fileDto.setFileNm(originalFilename);

				// Extract file type (extension)
				String extension = originalFilename.contains(".")
						? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
						: "";
				fileDto.setFileTp(extension);
			}

			// Set file size
			fileDto.setFileSz(file.getSize());

			// Generate filename: fileId
			String filename = UUID.randomUUID().toString();
			Path targetPath = Paths.get(directory, filename);

			// Copy file to target location
			Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

			// Update filePath with full path
			fileDto.setFilePath(targetPath.toString());

			// Set audit fields
			fileDto.setCoId(companyId);
			fileDto.setCreUsrId(user.getUsrId());
			fileDto.setUpdUsrId(user.getUsrId());

			fileMapper.insertFile(fileDto);

			log.info("[FileService][saveFile] File saved successfully: {}", targetPath);
			return fileDto;

		} catch (IOException e) {
			log.error("[FileService][saveFile] Failed to save file", e);
			return null;
		}
	}

	/**
	 * Build multi-tenant directory path: {root}/{companyId}/{subPath}
	 * 
	 * @param companyId the company ID
	 * @param subPath the sub-path constant
	 * @return the full directory path
	 */
	private String buildCompanyDirectory(String companyId, String subPath) {
		return Paths.get(UPLOAD_DIR, companyId, subPath).toString();
	}
	
	/**
	 * Save file from File object with default sub-path (uploads)
	 * 
	 * @param tempFile the temporary file to save
	 * @param coId the company ID
	 * @param usrId the user ID
	 * @return FileDto with saved file information, or null if failed
	 */
	public FileDto saveFile(File tempFile, String coId, String usrId) {
		return saveFile(tempFile, coId, usrId, FilePathConstants.DEFAULT);
	}

	/**
	 * Save file from File object with specified sub-path
	 * 
	 * @param tempFile the temporary file to save
	 * @param coId the company ID
	 * @param usrId the user ID
	 * @param subPath the sub-path constant (e.g., FilePathConstants.EMPLOYEE_IMAGE, FilePathConstants.CONTRACT)
	 * @return FileDto with saved file information, or null if failed
	 */
	public FileDto saveFile(File tempFile, String coId, String usrId, String subPath) {
	    if (tempFile == null || !tempFile.exists() || tempFile.length() == 0) {
	        log.warn("[FileService][saveFile] Attempted to save empty or non-existing file");
	        return null;
	    }

	    // Use default sub-path if not specified
	    if (subPath == null || subPath.trim().isEmpty()) {
	        subPath = FilePathConstants.DEFAULT;
	    }

	    // Build multi-tenant directory path: {root}/{companyId}/{subPath}
	    String directory = buildCompanyDirectory(coId, subPath);

	    // Ensure directory exists
	    if (!checkDirectory(directory)) {
	        return null;
	    }

	    try {
	        // Create FileDto
	        FileDto fileDto = new FileDto();

	        // Original file name
	        String originalFilename = tempFile.getName();
	        fileDto.setFileNm(originalFilename);

	        // Extract extension
	        String extension = originalFilename.contains(".")
	                ? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
	                : "";
	        fileDto.setFileTp(extension);

	        // Set file size
	        fileDto.setFileSz(tempFile.length());

	        // Generate unique filename and move file to company-specific directory
	        String filename = UUID.randomUUID().toString();
	        Path targetPath = Paths.get(directory, filename);
	        
	        // Copy file to target location
	        Files.copy(tempFile.toPath(), targetPath, StandardCopyOption.REPLACE_EXISTING);
	        
	        // Update filePath with new location
	        fileDto.setFilePath(targetPath.toString());

	        // Set audit fields
	        fileDto.setCoId(coId);
	        fileDto.setCreUsrId(usrId);
	        fileDto.setUpdUsrId(usrId);

	        // Insert into DB
	        fileMapper.insertFile(fileDto);

	        log.info("[FileService][saveFile] File saved successfully: {}", targetPath);

	        return fileDto;

	    } catch (Exception e) {
	        log.error("[FileService][saveFile] Failed to save file", e);
	        return null;
	    }
	}

	/**
	 * Save uploaded file with default sub-path (uploads)
	 * 
	 * @param file the multipart file to save
	 * @return FileDto with saved file information, or null if failed
	 */
	@Transactional(rollbackFor = Exception.class)
	public FileDto saveFile(MultipartFile file) {
		return saveFile(file, FilePathConstants.DEFAULT);
	}

	/**
	 * Save uploaded file with specified sub-path
	 * 
	 * @param file the multipart file to save
	 * @param subPath the sub-path constant (e.g., FilePathConstants.EMPLOYEE_IMAGE, FilePathConstants.CONTRACT)
	 * @return FileDto with saved file information, or null if failed
	 */
	@Transactional(rollbackFor = Exception.class)
	public FileDto saveFile(MultipartFile file, String subPath) {
		if (file == null || file.isEmpty()) {
			log.warn("[FileService][saveFile] Attempted to save empty file");
			return null;
		}

		// Get companyId from user context
		UserInfo user = CommonFunction.getUserInfo();
		String companyId = user.getCoId();
		
		// Use default sub-path if not specified
		if (subPath == null || subPath.trim().isEmpty()) {
			subPath = FilePathConstants.DEFAULT;
		}

		// Build multi-tenant directory path: {root}/{companyId}/{subPath}
		String directory = buildCompanyDirectory(companyId, subPath);

		// Ensure directory exists
		if (!checkDirectory(directory)) {
			return null;
		}

		try {
			// Create FileDto
			FileDto fileDto = new FileDto();
			fileDto.setFile(file);

			// Generate unique file ID
			String fileId = UUID.randomUUID().toString();
			fileDto.setFileId(fileId);

			// Get original filename and extension
			String originalFilename = file.getOriginalFilename();
			if (originalFilename != null) {
				fileDto.setFileNm(originalFilename);

				// Extract file type (extension)
				String extension = originalFilename.contains(".")
						? originalFilename.substring(originalFilename.lastIndexOf(".") + 1)
						: "";
				fileDto.setFileTp(extension);
			}

			// Set file size
			fileDto.setFileSz(file.getSize());

			// Generate filename: fileId
			String filename = UUID.randomUUID().toString();
			Path targetPath = Paths.get(directory, filename);

			// Copy file to target location
			Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

			// Update filePath with full path
			fileDto.setFilePath(targetPath.toString());

			// Set audit fields
			fileDto.setCoId(companyId);
			fileDto.setCreUsrId(user.getUsrId());
			fileDto.setUpdUsrId(user.getUsrId());

			fileMapper.insertFile(fileDto);

			log.info("[FileService][saveFile] File saved successfully: {}", targetPath);
			return fileDto;

		} catch (IOException e) {
			log.error("[FileService][saveFile] Failed to save file", e);
			return null;
		}
	}

	/**
	 * Check if directory exists, create it if not
	 * This method creates all necessary parent directories recursively
	 * 
	 * @param directoryPath the path to check/create
	 * @return true if directory exists or was created successfully, false otherwise
	 */
	private boolean checkDirectory(String directoryPath) {
		if (directoryPath == null || directoryPath.trim().isEmpty()) {
			log.error("[FileService][checkDirectory]: Directory path is null or empty");
			return false;
		}

		try {
			Path path = Paths.get(directoryPath).normalize();
			
			// Check if path already exists
			if (Files.exists(path)) {
				if (Files.isDirectory(path)) {
					log.debug("[FileService][checkDirectory]: Directory already exists: {}", directoryPath);
					return true;
				} else {
					log.error("[FileService][checkDirectory]: Path exists but is not a directory: {}", directoryPath);
					return false;
				}
			}

			// Create directory and all parent directories recursively
			Files.createDirectories(path);
			log.info("[FileService][checkDirectory]: Directory created successfully: {}", directoryPath);
			
			// Verify the directory was created
			if (Files.exists(path) && Files.isDirectory(path)) {
				return true;
			} else {
				log.error("[FileService][checkDirectory]: Directory creation verification failed: {}", directoryPath);
				return false;
			}

		} catch (IOException e) {
			log.error("[FileService][checkDirectory]: Failed to create directory: {}", directoryPath, e);
			return false;
		} catch (Exception e) {
			log.error("[FileService][checkDirectory]: Unexpected error while creating directory: {}", directoryPath, e);
			return false;
		}
	}

	/**
	 * Delete a file using FileDto
	 * 
	 * @param fileDto the file DTO containing file path
	 * @return true if deleted successfully
	 */
	@Transactional(rollbackFor = Exception.class)
	public boolean deleteFile(FileDto fileDto) {
		if (fileDto == null || fileDto.getFilePath() == null) {
			log.warn("[FileService][deleteFile] FileDto or filePath is null");
			return false;
		}
		Path path = Paths.get(fileDto.getFilePath());
		if (!Files.exists(path)) {
			log.warn("[FileService][deleteFile] File does not exist: {}", fileDto.getFilePath());
			return false;
		}
		try {
			fileMapper.deleteFile(fileDto);
			Files.delete(path);
			log.info("[FileService][deleteFile] File deleted successfully: {}", fileDto.getFilePath());
		} catch (Exception ex) {
			log.error("[FileService][deleteFile] Failed to delete file: {}", fileDto.getFilePath(), ex);
			return false;
		}
		return true;
	}

	/**
	 * Check if file exists
	 * 
	 * @param filePath the file path to check
	 * @return true if file exists
	 */
	public boolean fileExists(String filePath) {
		return Files.exists(Paths.get(filePath));
	}

	/**
	 * Check if file from FileDto exists
	 * 
	 * @param fileDto the file DTO
	 * @return true if file exists
	 */
	public boolean fileExists(FileDto fileDto) {
		if (fileDto == null || fileDto.getFilePath() == null) {
			return false;
		}
		return fileExists(fileDto.getFilePath());
	}
}
