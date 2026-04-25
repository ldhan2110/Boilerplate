import { ApiProperty } from '@nestjs/swagger';
import { ProgramDto } from './program.dto';

export class ProgramListDto {
  @ApiProperty({ type: [ProgramDto] })
  programList: ProgramDto[];

  @ApiProperty()
  total: number;

  static of(programList: ProgramDto[], total: number): ProgramListDto {
    const dto = new ProgramListDto();
    dto.programList = programList;
    dto.total = total;
    return dto;
  }
}
