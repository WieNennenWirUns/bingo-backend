import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: number, dto: CreateBoardDto) {
    const members = dto.members ?? [];
    const tasks = dto.tasks ?? [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: members.map((member) => member.userId) } },
      select: { id: true },
    });

    if (users.length !== members.length) {
      throw new BadRequestException('one or more users do not exist');
    }

    const filteredMembers = members.filter(
      (member) => member.userId !== ownerId,
    );
    const memberIds = [ownerId, ...filteredMembers.map((m) => m.userId)];

    const board = await this.prisma.$transaction(async (tx) => {
      const createdBoard = await tx.board.create({
        data: {
          name: dto.name,
          size: dto.size,
          ownerId: ownerId,
          tasks: {
            create: tasks.map((task) => ({
              content: task.content,
              requiresProof: task.requiresProof,
            })),
          },
          members: {
            create: [
              {
                userId: ownerId,
                role: 0,
              },
              ...filteredMembers.map((member) => ({
                userId: member.userId,
                role: member.role ?? 3,
              })),
            ],
          },
        },
        include: {
          tasks: true,
        },
      });

      const configsData: {
        userId: number;
        taskId: number;
        position: number;
      }[] = [];

      for (const userId of memberIds) {
        const shuffledTasks = [...createdBoard.tasks];
        for (let i = shuffledTasks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledTasks[i], shuffledTasks[j]] = [
            shuffledTasks[j],
            shuffledTasks[i],
          ];
        }

        shuffledTasks.forEach((task, index) => {
          configsData.push({
            userId,
            taskId: task.id,
            position: index,
          });
        });
      }

      await tx.hasBoardConfig.createMany({
        data: configsData,
      });

      return createdBoard;
    });

    return board;
  }
}
