
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(username: string, email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const friendcode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return this.prisma.user.create({
      data: {
        username,
        email,
        friendcode,
        credentials: hash,
      },
    });
  }
}