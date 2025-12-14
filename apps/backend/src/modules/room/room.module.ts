import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { FirebaseService } from '../../services/firebase.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService, FirebaseService],
  exports: [RoomService],
})
export class RoomModule {}
