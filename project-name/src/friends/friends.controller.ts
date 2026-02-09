// src/friends/friends.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  async sendRequest(@Request() req, @Body() dto: SendFriendRequestDto) {
    const userId = req.user.userId;
    return this.friendsService.sendFriendRequest(userId, dto.friendcode);
  }

  @Get('requests/incoming')
  async getIncoming(@Request() req) {
    const userId = req.user.userId;
    return this.friendsService.getIncomingRequests(userId);
  }

  @Post('requests/respond')
  async respond(@Request() req, @Body() dto: RespondFriendRequestDto) {
    const userId = req.user.userId;
    return this.friendsService.respondToRequest(
      userId,
      dto.requestId,
      dto.accept,
    );
  }

  @Get()
  async getFriends(@Request() req) {
    const userId = req.user.userId;
    return this.friendsService.getFriends(userId);
  }
}
