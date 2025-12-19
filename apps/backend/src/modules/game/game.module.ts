import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { RoomModule } from '../room/room.module';
import { UserModule } from '../user/user.module';
import { FirebaseService } from '../../services/firebase.service';
import { ScoreService } from '../../services/score.service';
import { AIService } from '../../services/ai.service';

@Module({
  imports: [RoomModule, UserModule],
  providers: [GameService, FirebaseService, ScoreService, AIService],
})
export class GameModule {}
