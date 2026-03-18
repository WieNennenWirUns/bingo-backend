import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class CreateMemberDto {
    @IsNumber()
    userId: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(3)
    role: number;
}