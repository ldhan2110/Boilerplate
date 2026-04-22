package com.clt.hrm.application.controllers.administration.program;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.core.administration.program.dtos.PermissionDto;
import com.clt.hrm.core.administration.program.dtos.ProgramDto;
import com.clt.hrm.core.administration.program.dtos.ProgramListDto;
import com.clt.hrm.core.administration.program.dtos.SearchProgramDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.administration.program.AdmProgramServiceResolver;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/program")
@Tag(name = "Program & Permission Management", description = "Operations related to Program & Permission management")
public class AdmProgramController {
	@Autowired
	private AdmProgramServiceResolver serviceResolver;
	
	@PostMapping("/getProgramList")
	public ResponseEntity<ProgramListDto> getProgramList(@Valid @RequestBody SearchProgramDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getProgramList(request));
	}
	
	@PostMapping("/getProgram")
	public ResponseEntity<ProgramDto> getProgram(@Valid @RequestBody SearchProgramDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getProgram(request));
	}
	
	@PostMapping("/insertProgram")
	public ResponseEntity<SuccessDto> insertProgram(@RequestBody ProgramDto request) {
		serviceResolver.getService().insertProgram(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	@PostMapping("/updateProgram")
	public ResponseEntity<SuccessDto> updateProgram(@RequestBody ProgramDto request) {
		serviceResolver.getService().updateProgram(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	@PostMapping("/deletePrograms")
	public ResponseEntity<SuccessDto> deleteProgram(@RequestBody List<ProgramDto> request) {
		serviceResolver.getService().deleteProgram(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	
	@PostMapping("/getPermissionByProgram")
	public ResponseEntity<List<PermissionDto>> getPermissionByProgram(@RequestBody ProgramDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getPermissionByProgram(request));
	}
	
	@PostMapping("/savePermissionsByProgram")
	public ResponseEntity<SuccessDto> savePermissionByProgram(@RequestBody List<PermissionDto> request) {
		serviceResolver.getService().savePermissionByProgram(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
