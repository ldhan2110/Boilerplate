import { ApiProperty } from '@nestjs/swagger';

export class SuccessDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  rows?: number;

  static of(success: boolean, rows?: number): SuccessDto {
    const dto = new SuccessDto();
    dto.success = success;
    dto.rows = rows;
    return dto;
  }
}
