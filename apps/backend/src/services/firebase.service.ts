import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: admin.database.Database;

  onModuleInit() {
    if (!admin.apps.length) {
      let credential: admin.credential.Credential;
      let databaseURL: string;

      if (process.env.FIREBASE_PRIVATE_KEY) {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
        };
        credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
        databaseURL = process.env.FIREBASE_DATABASE_URL ||
          `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;
      } else {
        const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
        if (!fs.existsSync(serviceAccountPath)) {
          console.error('Firebase service account not found. Set environment variables or provide firebase-service-account.json');
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
        databaseURL = process.env.FIREBASE_DATABASE_URL ||
          `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`;
      }

      admin.initializeApp({
        credential,
        databaseURL,
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
