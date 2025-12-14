import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: admin.database.Database;

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL ||
          `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`,
      });
    }

    this.db = admin.database();
  }

  getDatabase(): admin.database.Database {
    return this.db;
  }

  async get<T>(path: string): Promise<T | null> {
    const snapshot = await this.db.ref(path).once('value');
    return snapshot.val();
  }

  async set<T>(path: string, data: T): Promise<void> {
    await this.db.ref(path).set(data);
  }

  async update<T extends object>(path: string, data: T): Promise<void> {
    await this.db.ref(path).update(data);
  }

  async remove(path: string): Promise<void> {
    await this.db.ref(path).remove();
  }

  async push<T>(path: string, data: T): Promise<string> {
    const ref = await this.db.ref(path).push(data);
    return ref.key!;
  }
}
