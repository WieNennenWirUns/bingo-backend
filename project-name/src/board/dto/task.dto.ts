import { IsBoolean, IsString } from "class-validator";

export class TaskDto {
    @IsString()
    content: string;

    @IsBoolean()
    requiresProof: boolean;
}