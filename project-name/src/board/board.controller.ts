import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { AddMemberDto } from './dto/add-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('board')
export class BoardController {
    constructor(private readonly boardService: BoardService) { }

    @Post('create')
    async createBoard(@Request() req, @Body() dto: CreateBoardDto) {
        return this.boardService.create(req.user.userId, dto);
    }

    @Post('add-member')
    async addMember(@Request() req, @Body() dto: AddMemberDto) {
        return this.boardService.addMember(req.user.userId, dto);
    }
}
