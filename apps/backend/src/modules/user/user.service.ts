import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../../services/firebase.service';
import type { User } from '@rhythm-game/shared';

@Injectable()
export class UserService {
  constructor(private readonly firebase: FirebaseService) {}

  async createUser(odId: string, nickname: string): Promise<User> {
    const user: User = {
      odId,
      nickname,
      createdAt: Date.now(),
    };

    await this.firebase.set(`users/${odId}`, user);
    return user;
  }

  async getUser(odId: string): Promise<User | null> {
    return this.firebase.get<User>(`users/${odId}`);
  }

  async deleteUser(odId: string): Promise<void> {
    await this.firebase.remove(`users/${odId}`);
  }
}
