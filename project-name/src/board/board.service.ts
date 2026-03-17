import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardService {

    constructor(private readonly prisma: PrismaService) { }

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
}
