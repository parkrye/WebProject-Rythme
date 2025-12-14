import { Controller, Get, Param } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('api/rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getRoomList() {
    return this.roomService.getRoomList();
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.roomService.getRoom(roomId);
  }
}
