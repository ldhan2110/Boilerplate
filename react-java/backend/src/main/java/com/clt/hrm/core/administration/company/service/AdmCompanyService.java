package com.clt.hrm.core.administration.company.service;

import com.clt.hrm.core.administration.company.dtos.*;
import com.clt.hrm.core.administration.company.interfaces.IAdmCompanyService;
import com.clt.hrm.core.administration.company.mapper.AdmCompanyMapper;
import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdmCompanyService implements IAdmCompanyService {
	@Autowired
	private AdmCompanyMapper companyMapper;

	@Autowired
	private FileService fileService;

	public CompanyInfoListDto getListCompanyInfo(SearchCompanyDto request) {
		if (request.getFilters() != null && request.getFilters().size() > 0) {
			try {
				List<DynamicFilterDto> filterList = request.getFilters().stream()
						.map(filter -> CommonFunction.convertFilterValue(filter)).collect(Collectors.toList());
				request.setFilters(filterList);
			} catch (IllegalArgumentException e) {
				log.error("[AdmCompanyService][getListCompanyInfo] Error: {}", e.getMessage(), e);
				request.setFilters(null);
			}
		}

		CompanyInfoListDto result = new CompanyInfoListDto();
		result.setCompanyInfo(companyMapper.searchCompanyList(request));
		result.setTotal(companyMapper.countCompanyList(request));
		return result;
	}

	public CompanyInfoDto getCompanyInfo(SearchCompanyDto request) {
		CompanyInfoDto company = companyMapper.selectCompanyInfo(request);
		if (company == null) {
			return null;
		}
		// If logo file ID exists, fetch file details
		if (company.getLgoFileId() != null && !company.getLgoFileId().trim().isEmpty()) {
			try {
				SearchFileDto fileSearch = new SearchFileDto();
				fileSearch.setCoId(company.getCoId());
				fileSearch.setFileId(company.getLgoFileId());
				FileDto fileDto = fileService.getFile(fileSearch);
				if (fileDto != null) {
					company.setLogoFileDto(fileDto);
				}
			} catch (Exception e) {
				log.warn("[AdmCompanyService][getCompanyInfo] Error fetching logo file: {}", e.getMessage());
				// Don't fail the request if file fetch fails
			}
		}

		return company;
	}

	public boolean checkUniqueTaxCode(SearchCompanyDto request) {
		String taxCd = request.getTaxCd();
		if (taxCd == null || taxCd.trim().isEmpty()) {
			return true;
		}

		CompanyInfoDto existingTaxCd = companyMapper.selectCompanyByTaxCd(taxCd.trim(), request.getCoId());
		return existingTaxCd == null;
	}

	public boolean checkUniqueCompanyCode(SearchCompanyDto request) {
		String coId = request.getCoId();
		if (coId == null || coId.trim().isEmpty()) {
			return true;
		}

		CompanyInfoDto existingCompany = companyMapper.selectCompanyById(coId.trim());
		return existingCompany == null;
	}

	@Transactional(rollbackFor = Exception.class)
	public void createCompany(CompanyInfoDto request) {
		final String usrId = CommonFunction.getUserId();
		
		// Validate co_id is provided
		if (request.getCoId() == null || request.getCoId().trim().isEmpty()) {
			throw new BizException("ADM000015", null, "Company ID is required: " + request.getCoId(), HttpStatus.BAD_REQUEST);
		}

		// Check if company code is unique using checkUniqueCompanyCode method
		SearchCompanyDto companyCodeCheck = new SearchCompanyDto();
		companyCodeCheck.setCoId(request.getCoId());
		if (!checkUniqueCompanyCode(companyCodeCheck)) {
			throw new BizException("ADM000016", null, "Company code already exists: " + request.getCoId(), HttpStatus.BAD_REQUEST);
		}

		// Check if tax code is unique using checkUniqueTaxCode method (if provided)
		if (request.getTaxCd() != null && !request.getTaxCd().trim().isEmpty()) {
			SearchCompanyDto taxCodeCheck = new SearchCompanyDto();
			taxCodeCheck.setTaxCd(request.getTaxCd());
			taxCodeCheck.setCoId(null); // For create, exclude all companies
			if (!checkUniqueTaxCode(taxCodeCheck)) {
				CompanyInfoDto existingTaxCd = companyMapper.selectCompanyByTaxCd(request.getTaxCd(), null);
				throw new BizException("ADM000017", 
					null,
					"Tax code already exists. taxCd: " + request.getTaxCd() + ", existing company: " + existingTaxCd.getCoNm(), 
					HttpStatus.BAD_REQUEST);
			}
		}

		try {
			// Handle logo file upload if provided
			if (request.getLogoFile() != null && !request.getLogoFile().isEmpty()) {
				try {
					// Convert MultipartFile to temporary File to use saveFile method with explicit company ID
					MultipartFile multipartFile = request.getLogoFile();
					Path tempFile = Files.createTempFile("company_logo_", "_" + multipartFile.getOriginalFilename());
					multipartFile.transferTo(tempFile.toFile());
					
					try {
						// Save file using explicit company ID (new company's ID)
						FileDto savedFile = fileService.saveFile(tempFile.toFile(), request.getCoId(), usrId, FilePathConstants.LOGO);
						if (savedFile != null && savedFile.getFileId() != null) {
							request.setLgoFileId(savedFile.getFileId());
							log.info("[AdmCompanyService][createCompany] Logo file saved with ID: {}", savedFile.getFileId());
						} else {
							log.warn("[AdmCompanyService][createCompany] Failed to save logo file");
						}
					} finally {
						// Clean up temporary file
						try {
							Files.deleteIfExists(tempFile);
						} catch (IOException e) {
							log.warn("[AdmCompanyService][createCompany] Failed to delete temporary file: {}", e.getMessage());
						}
					}
				} catch (Exception e) {
					log.error("[AdmCompanyService][createCompany] Error saving logo file: {}", e.getMessage(), e);
					throw new BizException("ADM000020", null, "Failed to save logo file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
				}
			}

			// Set audit fields
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);

			// Insert company
			companyMapper.insertCompany(request);
			log.info("[AdmCompanyService][createCompany] Company created successfully: {}", request.getCoId());

		} catch (BizException e) {
			log.error("[AdmCompanyService][createCompany] Business error: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			log.error("[AdmCompanyService][createCompany] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void updateCompany(CompanyInfoDto request) {
		final String usrId = CommonFunction.getUserId();

		try {
			// 1) Validate company exists
			final CompanyInfoDto existingCompany = companyMapper.selectCompanyById(request.getCoId());
			if (existingCompany == null) {
				throw new BizException(
					"ADM000104",
					"Company does not exist.",
					"Company does not exist: " + request.getCoId(),
					HttpStatus.BAD_REQUEST
				);
			}

			// 2) Validate tax code uniqueness (only when provided + changed)
			final String newTaxCd = request.getTaxCd();
			if (newTaxCd != null && !newTaxCd.trim().isEmpty()) {
				final String currentTaxCd = existingCompany.getTaxCd();
				final boolean taxChanged = currentTaxCd == null || !currentTaxCd.equals(newTaxCd);

				if (taxChanged) {
					SearchCompanyDto taxCodeCheck = new SearchCompanyDto();
					taxCodeCheck.setTaxCd(newTaxCd);
					taxCodeCheck.setCoId(request.getCoId()); // exclude current company

					if (!checkUniqueTaxCode(taxCodeCheck)) {
						CompanyInfoDto existingTaxCd = companyMapper.selectCompanyByTaxCd(newTaxCd, request.getCoId());
						throw new BizException(
							"ADM000107",
							"Tax code already exists for company: " + (existingTaxCd != null ? existingTaxCd.getCoNm() : ""),
							"Tax code already exists. taxCd: " + newTaxCd
								+ ", existing company: " + (existingTaxCd != null ? existingTaxCd.getCoNm() : ""),
							HttpStatus.BAD_REQUEST
						);
					}
				}
			}

			// 3) Logo handling
			// FE convention: when user clears logo, FE sends lgoFileId = "" (empty string) and logoFile = null
			final boolean hasNewLogo = request.getLogoFile() != null && !request.getLogoFile().isEmpty();
			final boolean isClearLogoRequest =
				!hasNewLogo
					&& request.getLogoFile() == null
					&& request.getLgoFileId() != null
					&& request.getLgoFileId().trim().isEmpty();

			final String oldLogoFileId = existingCompany.getLgoFileId();

			if (hasNewLogo) {
				// Best-effort delete old logo (do not block upload if delete fails)
				if (oldLogoFileId != null && !oldLogoFileId.trim().isEmpty()) {
					try {
						SearchFileDto oldFileSearch = new SearchFileDto();
						oldFileSearch.setCoId(request.getCoId());
						oldFileSearch.setFileId(oldLogoFileId);

						FileDto oldFileDto = fileService.getFile(oldFileSearch);
						if (oldFileDto != null) {
							fileService.deleteFile(oldFileDto);
							log.info("[AdmCompanyService][updateCompany] Old logo file deleted: {}", oldLogoFileId);
						}
					} catch (Exception e) {
						log.warn("[AdmCompanyService][updateCompany] Error deleting old logo file: {}", e.getMessage());
					}
				}

				// Save new logo file (fail -> stop update)
				try {
					MultipartFile multipartFile = request.getLogoFile();
					Path tempFile = Files.createTempFile("company_logo_", "_" + multipartFile.getOriginalFilename());
					try {
						multipartFile.transferTo(tempFile.toFile());

						FileDto savedFile = fileService.saveFile(
							tempFile.toFile(),
							request.getCoId(),
							usrId,
							FilePathConstants.LOGO
						);

						if (savedFile != null && savedFile.getFileId() != null) {
							request.setLgoFileId(savedFile.getFileId());
							log.info("[AdmCompanyService][updateCompany] New logo file saved with ID: {}", savedFile.getFileId());
						} else {
							log.warn("[AdmCompanyService][updateCompany] Failed to save new logo file");
						}
					} finally {
						try {
							Files.deleteIfExists(tempFile);
						} catch (IOException e) {
							log.warn("[AdmCompanyService][updateCompany] Failed to delete temporary file: {}", e.getMessage());
						}
					}
				} catch (Exception e) {
					log.error("[AdmCompanyService][updateCompany] Error saving logo file: {}", e.getMessage(), e);
					throw new BizException(
						"ADM000105",
						"Failed to save logo file.",
						"Failed to save logo file: " + e.getMessage(),
						HttpStatus.INTERNAL_SERVER_ERROR
					);
				}
			} else if (isClearLogoRequest) {
				// Best-effort delete old logo (do not block update if delete fails)
				if (oldLogoFileId != null && !oldLogoFileId.trim().isEmpty()) {
					try {
						SearchFileDto oldFileSearch = new SearchFileDto();
						oldFileSearch.setCoId(request.getCoId());
						oldFileSearch.setFileId(oldLogoFileId);

						FileDto oldFileDto = fileService.getFile(oldFileSearch);
						if (oldFileDto != null) {
							fileService.deleteFile(oldFileDto);
							log.info("[AdmCompanyService][updateCompany] Old logo file deleted (clear): {}", oldLogoFileId);
						}
					} catch (Exception e) {
						log.warn("[AdmCompanyService][updateCompany] Error deleting old logo file on clear: {}", e.getMessage());
					}
				}

				// Keep empty string so mapper can set NULL (your mapper uses lgoFileId == '' -> NULL)
				request.setLgoFileId("");
			} else {
				// No new file + not clear:
				// if FE didn't send lgoFileId => keep existing; if FE sent a value => respect it
				if (request.getLgoFileId() == null) {
					request.setLgoFileId(existingCompany.getLgoFileId());
				}
			}

			// 4) Update
			request.setUpdUsrId(usrId);
			companyMapper.updateCompany(request);

			log.info("[AdmCompanyService][updateCompany] Company updated successfully: {}", request.getCoId());
		} catch (BizException e) {
			log.error("[AdmCompanyService][updateCompany] Business error: {}", e.getMessage(), e);
			throw e;
		} catch (Exception e) {
			log.error("[AdmCompanyService][updateCompany] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

}

