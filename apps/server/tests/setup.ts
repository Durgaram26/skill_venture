import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { flushMemoryTokenStore } from '../src/modules/auth/token.store.js';
import { Listing } from '../src/models/Listing.js';
import type { Express } from 'express';

let mongo: MongoMemoryServer;
export let app: Express;

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]?.deleteMany({});
  }
  flushMemoryTokenStore();
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Listing.syncIndexes();
  app = createApp();
});

beforeEach(() => {
  flushMemoryTokenStore();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});
