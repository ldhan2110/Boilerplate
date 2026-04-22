import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SuccessDto } from '@infra/common/dtos';
import { PermissionDto, ProgramDto, ProgramListDto, SearchProgramDto } from './dto';
import { ProgramsService } from './programs.service';

@Controller('api/sys/program')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // POST /api/sys/program/getProgramList
  @Post('getProgramList')
  @HttpCode(HttpStatus.OK)
  getProgramList(@Body() dto: SearchProgramDto): Promise<ProgramListDto> {
    return this.programsService.getProgramList(dto);
  }

  // POST /api/sys/program/getProgram
  @Post('getProgram')
  @HttpCode(HttpStatus.OK)
  getProgram(@Body() dto: SearchProgramDto): Promise<ProgramDto | null> {
    return this.programsService.getProgram(dto);
  }

  // POST /api/sys/program/insertProgram
  @Post('insertProgram')
  @HttpCode(HttpStatus.OK)
  async insertProgram(@Body() dto: ProgramDto): Promise<SuccessDto> {
    await this.programsService.insertProgram(dto);
    return SuccessDto.of(true);
  }

  // POST /api/sys/program/updateProgram
  @Post('updateProgram')
  @HttpCode(HttpStatus.OK)
  async updateProgram(@Body() dto: ProgramDto): Promise<SuccessDto> {
    await this.programsService.updateProgram(dto);
    return SuccessDto.of(true);
  }

  // POST /api/sys/program/deletePrograms
  @Post('deletePrograms')
  @HttpCode(HttpStatus.OK)
  async deletePrograms(@Body() list: ProgramDto[]): Promise<SuccessDto> {
    await this.programsService.deletePrograms(list);
    return SuccessDto.of(true, list.length);
  }

  // POST /api/sys/program/getPermissionByProgram
  @Post('getPermissionByProgram')
  @HttpCode(HttpStatus.OK)
  getPermissionByProgram(@Body() dto: SearchProgramDto): Promise<PermissionDto[]> {
    return this.programsService.getPermissionByProgram(dto);
  }

  // POST /api/sys/program/savePermissionsByProgram
  @Post('savePermissionsByProgram')
  @HttpCode(HttpStatus.OK)
  async savePermissionsByProgram(@Body() list: PermissionDto[]): Promise<SuccessDto> {
    await this.programsService.savePermissionByProgram(list);
    return SuccessDto.of(true, list.length);
  }
}
