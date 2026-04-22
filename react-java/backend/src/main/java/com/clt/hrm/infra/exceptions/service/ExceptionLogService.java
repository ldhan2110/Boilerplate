package com.clt.hrm.infra.exceptions.service;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.LinkedBlockingQueue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.util.ContentCachingRequestWrapper;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.exceptions.dtos.ExceptionLogDto;
import com.clt.hrm.infra.exceptions.dtos.ExceptionLogListDto;
import com.clt.hrm.infra.exceptions.dtos.SearchExceptionLogDto;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.exceptions.mapper.ExceptionLogMapper;
import com.clt.hrm.tenant.TenantContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ExceptionLogService {

	private final LinkedBlockingQueue<ExceptionLogDto> exceptionQueue = new LinkedBlockingQueue<>(1000);

	@Value("${error.queue.capacity:1000}")
	private int queueCapacity;

	@Value("${error.batch.size:10}")
	private int batchSize;

	@Autowired
	private ExceptionLogMapper exceptionLogMapper;

	public ExceptionLogListDto getHistoryList(SearchExceptionLogDto request) {
		ExceptionLogListDto result = new ExceptionLogListDto();
		result.setMessageList(exceptionLogMapper.searchMessageHistoryList(request));
		return result;
	}

	@Async("logExecutor")
	public void persistLogError(ExceptionLogDto errorLog) {
		try {
			exceptionLogMapper.persistLogError(errorLog);
		} catch (Exception e) {
			log.error("[ExceptionLogService][logError] Failed to log error to database", e);
		}
	}

	@PostConstruct
	public void startProcessing() {
		processErrorsAsync();
		log.info("[ExceptionLogService] Async exception queue processor started.");
	}

	@PreDestroy
	public void shutdown() {
		drainQueue();
		log.info("[ExceptionLogService] Exception queue drained on shutdown.");
	}

	public void cleanupLog(String coId) {
		exceptionLogMapper.cleanupLog(coId);
	}

	private void drainQueue() {
		List<ExceptionLogDto> remaining = new ArrayList<>();
		exceptionQueue.drainTo(remaining);
		if (!remaining.isEmpty()) {
			log.info("[ExceptionLogService][drainQueue] Saving {} remaining error logs", remaining.size());
			try {
				for (ExceptionLogDto errorLog : remaining) {
					try {
						if (errorLog.getCoId() != null && !errorLog.getCoId().trim().isEmpty()) {
							TenantContext.setTenant(errorLog.getCoId());
						}
						exceptionLogMapper.persistLogError(errorLog);
					} finally {
						TenantContext.clear();
					}
				}
			} catch (Exception e) {
				log.error("[ExceptionLogService][drainQueue] Failed to save remaining errors on shutdown", e);
			}
		}
	}

	@Async("logExecutor")
	public void logException(ExceptionLogDto errorLog) {
		boolean added = exceptionQueue.offer(errorLog);
		if (!added) {
			log.error("[ExceptionLogService][logException] Error queue is full! Exception not queued: {}",
					errorLog.getErrMsg());
			try {
				if (errorLog.getCoId() != null && !errorLog.getCoId().trim().isEmpty()) {
					TenantContext.setTenant(errorLog.getCoId());
				}
				exceptionLogMapper.persistLogError(errorLog);
			} finally {
				TenantContext.clear();
			}
		}
	}

	@Async("logExecutor")
	@Scheduled(fixedDelayString = "${error.processing.delay:1000}")
	public void processErrorsAsync() {
		List<ExceptionLogDto> batch = new ArrayList<>();
		exceptionQueue.drainTo(batch, batchSize);

		if (!batch.isEmpty()) {
			for (ExceptionLogDto errorLog : batch) {
				try {
					if (errorLog.getCoId() != null && !errorLog.getCoId().trim().isEmpty()) {
						TenantContext.setTenant(errorLog.getCoId());
					}
					exceptionLogMapper.persistLogError(errorLog);
				} finally {
					TenantContext.clear();
				}
			}
		}
	}

	/**
	 * Build ErrorLog entity from BizException and WebRequest
	 */
	public ExceptionLogDto buildErrorLog(Exception ex, WebRequest request) {
		ExceptionLogDto dto = new ExceptionLogDto();

		// Error message
		if (ex instanceof BizException)
			dto.setErrMsg(((BizException) ex).getSystemMessage());
		else
			dto.setErrMsg(ex.getMessage());

		// Extract endpoint
		String endpoint = "";
		if (request instanceof ServletWebRequest servletRequest) {
			endpoint = servletRequest.getRequest().getRequestURI();
		}
		dto.setEndpoint(endpoint);

		String mdlNm = "";
		if (endpoint != null && endpoint.startsWith("/")) {
			String[] parts = endpoint.split("/");
			if (parts.length > 1) {
				mdlNm = parts[2].toUpperCase();
			}
		}
		dto.setMdlNm(mdlNm);

		// Extract request parameters (convert to JSON)
		dto.setRqstPara(extractRequestDataAsJson(request));

		// Add stack trace (first 10 lines only to save space)
		String stackTrace = getStackTraceAsString(ex);
		String[] stackLines = stackTrace.split("\n");
		StringBuilder shortStack = new StringBuilder();
		for (int i = 0; i < Math.min(10, stackLines.length); i++) {
			shortStack.append(stackLines[i]).append("\n");
		}
		dto.setStackTrace(shortStack.toString());

		UserInfo usr = getCurrentUser();
		if (usr != null) {
			dto.setCoId(usr.getCoId());
			dto.setCreUsrId(usr.getUsrId());
			dto.setUpdUsrId(usr.getUsrId());
		} else {
			dto.setCoId("ANOMYOUS");
			dto.setCreUsrId("ANOMYOUS");
			dto.setUpdUsrId("ANOMYOUS");
		}

		dto.setCreDt(LocalDateTime.now().toString());
		return dto;
	}

	private String getStackTraceAsString(Exception exception) {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		exception.printStackTrace(pw);
		return sw.toString();
	}

	private JsonNode extractRequestDataAsJson(WebRequest request) {
		try {
			ObjectMapper mapper = new ObjectMapper();

			if (!(request instanceof ServletWebRequest servletRequest)) {
				return mapper.createObjectNode();
			}

			HttpServletRequest httpReq = servletRequest.getRequest();
			String method = httpReq.getMethod();

			// ----------- GET → Use params -----------
			if ("GET".equalsIgnoreCase(method)) {
				return extractQueryParamsAsJson(httpReq, mapper);
			}

			// ----------- POST / PUT / PATCH → Read body -----------
			return extractBodyAsJson(httpReq, mapper);

		} catch (Exception e) {
			return null;
		}
	}

	private JsonNode extractQueryParamsAsJson(HttpServletRequest request, ObjectMapper mapper) {
		Map<String, String[]> paramMap = request.getParameterMap();

		Map<String, Object> cleanMap = new HashMap<>();
		paramMap.forEach((k, v) -> cleanMap.put(k, v.length == 1 ? v[0] : v));

		return mapper.valueToTree(cleanMap);
	}

	private JsonNode extractBodyAsJson(HttpServletRequest request, ObjectMapper mapper) {
		try {
			if (request instanceof ContentCachingRequestWrapper wrapper) {
				byte[] body = wrapper.getContentAsByteArray();

				if (body.length == 0) {
					return mapper.createObjectNode(); // empty body
				}

				String bodyString = new String(body, wrapper.getCharacterEncoding());
				return mapper.readTree(bodyString);
			}

			// If wrapper missing, request body can't be read safely
			return mapper.createObjectNode();

		} catch (Exception e) {
			return mapper.createObjectNode();
		}
	}

	/**
	 * Get current authenticated user ID from security context
	 */
	private UserInfo getCurrentUser() {
		try {
			Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
			if (principal != null) {
				return (UserInfo) principal;
			}
		} catch (Exception e) {
			log.debug("Could not retrieve user ID from security context", e);
		}
		return null;
	}
}
