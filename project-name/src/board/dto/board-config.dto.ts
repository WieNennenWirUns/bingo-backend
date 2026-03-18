import { IsBoolean, IsDate, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { TaskDto } from "./task.dto";

export class BoardConfigDto {
    @IsObject()
    task: TaskDto;

    @IsBoolean()
    completed: boolean;

    @IsNumber()
    position: number;

    @IsOptional()
    @IsDate()
    timeStamp: Date | null;
}