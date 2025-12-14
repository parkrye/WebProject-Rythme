import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { FirebaseService } from '../../services/firebase.service';

@Module({
  controllers: [UserController],
  providers: [UserService, FirebaseService],
  exports: [UserService],
})
export class UserModule {}
