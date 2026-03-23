import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FriendsModule } from 'src/friends/friends.module';

@Module({
  imports: [PrismaModule, FriendsModule],
  providers: [BoardService],
  controllers: [BoardController]
})
export class BoardModule {}
