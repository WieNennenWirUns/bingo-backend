import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { BoardConfigDto } from './dto/board-config.dto';

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

  async markTask(userId: number, boardId: number, taskId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('user does not exist');
    }

    const board = await this.prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      throw new BadRequestException('board does not exist');
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw new BadRequestException('task does not exist');
    }

    if (task.boardId !== boardId) {
      throw new BadRequestException('task does not belong to the board');
    }

    const member = await this.prisma.isMemberOf.findFirst({
      where: {
        boardId,
        userId,
      },
    });

    if (!member) {
      throw new UnauthorizedException('user is not a member of the board');
    }

    const config = await this.prisma.hasBoardConfig.findFirst({
      where: {
        userId,
        taskId,
      }
    });

    if (!config) {
      throw new BadRequestException('task is not assigned to the user');
    }

    return await this.prisma.hasBoardConfig.update({
      where: {
        userId_taskId: {
          userId,
          taskId,
        },
      },
      data: {
        completed: !config.completed,
      }
    });
  }
  
  async getBoardConfig(userId: number, boardId: number): Promise<{ boardConfigs: BoardConfigDto[], unassignedTasksCount: number }> {
    const boardConfigs: BoardConfigDto[] = [];
    let unassignedTasksCount = 0;

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('user does not exist');
    }

    const board = await this.prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      throw new BadRequestException('board does not exist');
    }

    const member = await this.prisma.isMemberOf.findFirst({
      where: {
        boardId,
        userId,
      },
    });

    if (!member) {
      throw new UnauthorizedException('user is not a member of the board');
    }

    const tasks = await this.prisma.task.findMany({
      where: { boardId }
    });

    for (const task of tasks) {
      const config = await this.prisma.hasBoardConfig.findFirst({
        where: {
          userId,
          taskId: task.id,
        }
      });

      if (!config) {
        unassignedTasksCount++;
        continue;
      }

      boardConfigs.push({
        task: {
          content: task.content,
          requiresProof: task.requiresProof,
        },
        completed: config.completed,
        position: config.position,
        timeStamp: config.timestampComp,
      });
    }

    return {  boardConfigs, unassignedTasksCount };
  }
}
