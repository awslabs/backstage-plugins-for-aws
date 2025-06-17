/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ChatSession } from '@aws/genai-plugin-for-backstage-common';
import {
  DatabaseService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { isNil } from 'lodash';

export type RawDbEntityResultRow = {
  session_id: string;
  principal: string;
  agent: string;
  created: Date;
  ended?: Date;
  last_activity: Date;
};

export interface SessionStore {
  createSession({
    agent,
    sessionId,
    principal,
    ended,
  }: {
    agent: string;
    sessionId: string;
    principal: string;
    ended: boolean;
  }): Promise<ChatSession>;
  getSessionsForUser(principal: string): Promise<ChatSession[]>;
  getSession(
    agent: string,
    sessionId: string,
    principal: string,
  ): Promise<ChatSession | undefined>;
  endSession(
    agent: string,
    sessionId: string,
    principal: string,
  ): Promise<void>;
}

const migrationsDir = resolvePackagePath(
  '@aws/genai-plugin-for-backstage-backend',
  'migrations',
);

export class DatabaseSessionStore implements SessionStore {
  private constructor(private readonly db: Knex) {}

  static async create({
    database,
    skipMigrations,
  }: {
    database: DatabaseService;
    skipMigrations?: boolean;
  }): Promise<DatabaseSessionStore> {
    const client = await database.getClient();

    if (!database.migrations?.skip && !skipMigrations) {
      await client.migrate.latest({
        directory: migrationsDir,
      });
    }

    return new DatabaseSessionStore(client);
  }

  async createSession({
    agent,
    sessionId,
    principal,
    ended = false,
  }: {
    agent: string;
    sessionId: string;
    principal: string;
    ended: boolean;
  }): Promise<ChatSession> {
    const [result] = await this.db<RawDbEntityResultRow>('chat_sessions')
      .insert({
        session_id: sessionId,
        principal,
        agent: agent,
      })
      .returning('created')
      .returning('last_activity');

    return {
      sessionId: sessionId,
      principal,
      agent: agent,
      created: result.created,
      lastActivity: result.last_activity,
      ended: ended ? new Date() : undefined,
    };
  }

  async endSession(
    agent: string,
    sessionId: string,
    principal: string,
  ): Promise<void> {
    await this.db<RawDbEntityResultRow>('chat_sessions')
      .where({
        session_id: sessionId,
        agent,
        principal,
      })
      .update({
        ended: new Date(),
      });
  }

  async getSessionsForUser(principal: string): Promise<ChatSession[]> {
    const result = await this.db<RawDbEntityResultRow>('chat_sessions').where({
      principal,
    });

    return result.map(row => ({
      sessionId: row.session_id,
      principal: row.principal,
      agent: row.agent,
      created: row.created,
      ended: row.ended,
      lastActivity: row.last_activity,
    }));
  }

  async getSession(
    agent: string,
    sessionId: string,
    principal: string,
  ): Promise<ChatSession | undefined> {
    const result = await this.db<RawDbEntityResultRow>('chat_sessions')
      .where({
        session_id: sessionId,
        agent,
        principal,
      })
      .first();

    if (isNil(result)) {
      return undefined;
    }

    return {
      sessionId: result.session_id,
      principal: result.principal,
      agent: result.agent,
      created: result.created,
      ended: result.ended,
      lastActivity: result.last_activity,
    };
  }
}
