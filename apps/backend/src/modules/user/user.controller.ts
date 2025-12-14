import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: { odId: string; nickname: string }) {
    return this.userService.createUser(body.odId, body.nickname);
  }

  @Get(':odId')
  async getUser(@Param('odId') odId: string) {
    return this.userService.getUser(odId);
  }
}
