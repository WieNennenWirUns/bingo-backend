// src/friends/friends.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendRequestStatus } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(fromUserId: number, friendcode: string) {
    const toUser = await this.prisma.user.findFirst({
      where: { friendcode },
    });

    if (!toUser) {
      throw new NotFoundException('an user with this friendcode doesn\'t exist');
    }
    if (toUser.id === fromUserId) {
      throw new BadRequestException('you cannot add yourself');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: fromUserId, user2Id: toUser.id },
          { user1Id: toUser.id, user2Id: fromUserId },
        ],
      },
    });
    if (existingFriendship) {
      throw new BadRequestException('you are already a befriended with this user');
    }

    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        fromId: fromUserId,
        toId: toUser.id,
        status: FriendRequestStatus.PENDING,
      },
    });
    if (existingRequest) {
      throw new BadRequestException(
        'there is alredy a pending request',
      );
    }

    return this.prisma.friendRequest.create({
      data: {
        fromId: fromUserId,
        toId: toUser.id,
      },
    });
  }

  async getIncomingRequests(userId: number) {
    return this.prisma.friendRequest.findMany({
      where: {
        toId: userId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        from: {
          select: { id: true, username: true, friendcode: true },
        },
      },
    });
  }

  async respondToRequest(
    currentUserId: number,
    requestId: number,
    accept: boolean,
  ) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('this request does not exist');
    }

    if (request.toId !== currentUserId) {
      throw new ForbiddenException('you are not allowed to answer this request');
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('this request has already been answered');
    }

    if (!accept) {
      return this.prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: FriendRequestStatus.REJECTED,
          respondedAt: new Date(),
        },
      });
    }

    const [updatedRequest, friendship] = await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: FriendRequestStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      }),
      this.prisma.friendship.create({
        data: {
          user1Id: Math.min(request.fromId, request.toId),
          user2Id: Math.max(request.fromId, request.toId),
        },
      }),
    ]);

    return { request: updatedRequest, friendship };
  }

  async getFriends(userId: number) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        user1: {
          select: { id: true, username: true, friendcode: true },
        },
        user2: {
          select: { id: true, username: true, friendcode: true },
        },
      },
    });

    return friendships.map((f) =>
      f.user1Id === userId ? f.user2 : f.user1,
    );
  }
}
