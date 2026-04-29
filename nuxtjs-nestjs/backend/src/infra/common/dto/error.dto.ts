import { IsString } from "class-validator";

export class ErrorDto {
    @IsString()
    errorCode: string;

    @IsString()
    errorType: 'ERROR'  | 'WARN';

    @IsString()
    errorMessage?: string;

    constructor(partial: Partial<ErrorDto>) {
        Object.assign(this, partial);
    }
}