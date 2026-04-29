import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ErrorDto {
    @IsString()
    @ApiProperty()        
    errorCode: string;

    @IsString()
    @ApiProperty({ enum: ['ERROR', 'WARN'] })
    errorType: 'ERROR'  | 'WARN';

    @IsString()
    @ApiProperty({ required: false })   
    errorMessage?: string;

    constructor(partial: Partial<ErrorDto>) {
        Object.assign(this, partial);
    }
}