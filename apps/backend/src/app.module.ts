import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { RoomModule } from './modules/room/room.module';
import { GameModule } from './modules/game/game.module';
import { FirebaseService } from './services/firebase.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    RoomModule,
    GameModule,
  ],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class AppModule {}
