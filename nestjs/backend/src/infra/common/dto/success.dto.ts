export class SuccessDto {
  success: boolean;
  rows?: number;

  static of(success: boolean, rows?: number): SuccessDto {
    const dto = new SuccessDto();
    dto.success = success;
    dto.rows = rows;
    return dto;
  }
}
