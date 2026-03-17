import { IsNumber, IsObject } from "class-validator";
import { CreateMemberDto } from "./create-member.dto";

export class AddMemberDto {
    @IsObject()
    member: CreateMemberDto;

    @IsNumber()
    boardId: number;
}