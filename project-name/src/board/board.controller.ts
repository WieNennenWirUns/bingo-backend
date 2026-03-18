import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';

@UseGuards(JwtAuthGuard)
@Controller('board')
export class BoardController {
    constructor(private readonly boardService: BoardService) { }

    @Post('create')
    async createBoard(@Request() req, @Body() dto: CreateBoardDto) {
        return this.boardService.create(req.user.userId, dto);
    }

    @Post('mark-task/:boardId/:taskId')
    async markTask(@Request() req, @Param('boardId') boardId: string, @Param('taskId') taskId: string) {
        return this.boardService.markTask(req.user.userId, parseInt(boardId), parseInt(taskId));
    }

    @Get('config/:boardId')
    async getBoardConfig(@Request() req, @Param('boardId') boardId: string) {
        return this.boardService.getBoardConfig(req.user.userId, parseInt(boardId));
    }
}
