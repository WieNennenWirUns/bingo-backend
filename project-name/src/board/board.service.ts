import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { FriendsService } from 'src/friends/friends.service';

@Injectable()
export class BoardService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly friendsService: FriendsService
    ) { }

    async create(ownerId: number, dto: CreateBoardDto) {
        dto.members = dto.members || [];
        dto.tasks = dto.tasks || [];
        const users = await this.prisma.user.findMany({
            where: { id: { in: dto.members.map(member => member.userId) } },
            select: { id: true },
        });

        if (users.length != dto.members.length) {
            throw new BadRequestException("one or more users do not exist");
        }

        dto.members = dto.members.filter(member => member.userId != ownerId);
        
        return this.prisma.board.create({
            data: {
                name: dto.name,
                size: dto.size,
                ownerId: ownerId,

                tasks: {
                        create: dto.tasks.map(task => ({
                            content: task.content,
                            requiresProof: task.requiresProof
                        }))
                    },

                members: {
                    create: [
                        { 
                            userId: ownerId,
                            role: 0
                        },
                        ...dto.members.map(member => ({
                            userId: member.userId,
                            role: member.role ?? 3
                        }))
                    ]
                }
            }
        });
    }

    async addMember(userId: number, dto: AddMemberDto) {
        const board = await this.prisma.board.findUnique({
            where: { id: dto.boardId },
            select: { members: true }
        });
        const user = await this.prisma.user.findUnique({
            where: { id: dto.member.userId },
            select: { id: true }
        });

        if (!board) {
            throw new BadRequestException("board does not exist");
        }
        if (!user) {
            throw new BadRequestException("user does not exist");
        }

        if (!board.members.some(member => member.userId == userId && member.role <= 1)) {
            throw new BadRequestException("user does not have permission to add members");
        }

        const friendShipExists = await this.friendsService.isFriend(userId, dto.member.userId);
        if (!friendShipExists) {
            throw new BadRequestException("you can only add friends to the board");
        }

        if (board.members.some(member => member.userId == dto.member.userId)) {
            throw new BadRequestException("user is already a member of the board");
        }

        return this.prisma.board.update({
            where: { id: dto.boardId },
            data: {
                members: {
                    create: {
                        userId: dto.member.userId,
                        role: dto.member.role ?? 3
                    }
                }
            }
        });
    }
}
