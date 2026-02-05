import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(username: string, email: string, password: string) {

    if (username.length == 0) {
      throw new BadRequestException("username can't be empty");
    }

    if (username.length > 20) {
      throw new BadRequestException('username should not exceed 20 characters');
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      let friendcode: string;
      let existingUser;

      do {
        friendcode = Math.random().toString(36).substring(2, 8).toUpperCase();
        existingUser = await this.prisma.user.findFirst({
          where: { friendcode }
        });
      } while (existingUser);

      return await this.prisma.user.create({
        data: {
          username,
          email,
          friendcode,
          credentials: hash,
        },
      });
    } catch (error: any) {
      console.log('Prisma Error Code:', error.code);
      console.log('Prisma Error Meta:', error.meta);

      if (error.code === 'P2025') {
        throw new BadRequestException(
          'username should not exceed 20 characters',
        );
      }

      if (error.code === 'P2002') {
        const existingUserByEmail = await this.prisma.user.findUnique({
          where: { email }
        });

        const existingUserByUsername = await this.prisma.user.findFirst({
          where: { username }
        });

        if (existingUserByEmail) {
          throw new BadRequestException('email already exists');
        }

        if (existingUserByUsername) {
          throw new BadRequestException('username already exists');
        }
      }

      throw new BadRequestException('error while handling request');
    }
  }

}
