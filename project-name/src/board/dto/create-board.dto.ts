import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { CreateTaskDto } from "src/board/dto/create-task.dto";
import { CreateMemberDto } from "./create-member.dto";

export class CreateBoardDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    name: string;

    @IsNumber()
    @Max(7)
    @Min(3)
    size: number;

    @ValidateNested({ each: true })
    @Type(() => CreateTaskDto)
    tasks: CreateTaskDto[];
    
    @ValidateNested({ each: true })
    @Type(() => CreateMemberDto)
    members: CreateMemberDto[];
}