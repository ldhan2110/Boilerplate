import { ProgramDto } from './program.dto';

export class ProgramListDto {
  programList: ProgramDto[];
  total: number;

  static of(programList: ProgramDto[], total: number): ProgramListDto {
    const dto = new ProgramListDto();
    dto.programList = programList;
    dto.total = total;
    return dto;
  }
}
