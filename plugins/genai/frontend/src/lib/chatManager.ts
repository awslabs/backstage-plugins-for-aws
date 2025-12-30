/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { match } from 'ts-pattern';
import { ChatMessage } from '../components/types';
import { AgentApi } from '../api';

export interface ChatStorage {
  saveMessages(key: string, messages: ChatMessage[]): void;
  loadMessages(key: string): ChatMessage[] | null;
  saveSessionId(key: string, sessionId: string): void;
  loadSessionId(key: string): string | null;
  clearStorage(messagesKey: string, sessionIdKey: string): void;
}

export class LocalStorageChatStorage implements ChatStorage {
  saveMessages(key: string, messages: ChatMessage[]): void {
    localStorage.setItem(key, JSON.stringify(messages));
  }

  loadMessages(key: string): ChatMessage[] | null {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        throw new Error(`Error parsing stored messages: ${error}`);
      }
    }
    return null;
  }

  saveSessionId(key: string, sessionId: string): void {
    localStorage.setItem(key, sessionId);
  }

  loadSessionId(key: string): string | null {
    return localStorage.getItem(key);
  }

  clearStorage(messagesKey: string, sessionIdKey: string): void {
    localStorage.removeItem(messagesKey);
    localStorage.removeItem(sessionIdKey);
  }
}

export type ChatSessionEvent = {
  type: 'messagesChanged';
  messages: ChatMessage[];
};

export class ChatSessionManager {
  private messages: ChatMessage[] = [];
  private sessionId?: string;
  private readonly messagesStorageKey: string;
  private readonly sessionIdStorageKey: string;
  private readonly storage: ChatStorage = new LocalStorageChatStorage();

  constructor(
    private readonly agentApi: AgentApi,
    private readonly agentName: string,
    private readonly onEvent: (event: ChatSessionEvent) => void,
    storageKeyPrefix = `agent-chat-`,
  ) {
    this.messagesStorageKey = `${storageKeyPrefix}${agentName}-messages`;
    this.sessionIdStorageKey = `${storageKeyPrefix}${agentName}-sessionId`;
  }

  public async loadFromStorage(): Promise<void> {
    const storedSessionId = this.storage.loadSessionId(
      this.sessionIdStorageKey,
    );
    if (storedSessionId) {
      const sessionExists = await this.agentApi.getUserSession(
        this.agentName,
        storedSessionId,
      );

      if (!sessionExists) {
        this.storage.clearStorage(
          this.messagesStorageKey,
          this.sessionIdStorageKey,
        );
        return;
      }

      this.sessionId = storedSessionId;
    }

    const storedMessages = this.storage.loadMessages(this.messagesStorageKey);
    if (storedMessages) {
      this.messages = storedMessages;
      this.emitMessagesChanged();
    }
  }

  private saveToStorage(): void {
    if (this.messages.length > 0) {
      this.storage.saveMessages(this.messagesStorageKey, this.messages);
    }
    if (this.sessionId) {
      this.storage.saveSessionId(this.sessionIdStorageKey, this.sessionId);
    }
  }

  private emitMessagesChanged(): void {
    this.onEvent({ type: 'messagesChanged', messages: [...this.messages] });
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  async sendUserMessage(
    userMessage: string,
    signal?: AbortSignal,
  ): Promise<void> {
    this.messages = [
      ...this.messages,
      {
        payload: userMessage,
        type: 'user',
        tools: [],
      },
      {
        payload: '',
        type: 'agent',
        tools: [],
      },
    ];
    this.emitMessagesChanged();

    try {
      for await (const chunk of this.agentApi.chatSync(
        {
          userMessage,
          sessionId: this.sessionId,
          agentName: this.agentName,
        },
        signal,
      )) {
        match(chunk)
          .with({ type: 'ChunkEvent' }, e => {
            const lastIndex = this.messages.length - 1;
            const lastMessage = this.messages[lastIndex];
            lastMessage.payload = lastMessage.payload.concat(e.token);
            this.messages[lastIndex] = lastMessage;
            this.emitMessagesChanged();
          })
          .with({ type: 'ResponseEvent' }, e => {
            this.sessionId = e.sessionId;
            this.saveToStorage();
          })
          .with({ type: 'ToolEvent' }, e => {
            const lastIndex = this.messages.length - 1;
            const lastMessage = this.messages[lastIndex];
            lastMessage.tools.push(e);
            this.messages[lastIndex] = lastMessage;
            this.emitMessagesChanged();
          })
          .with({ type: 'ErrorEvent' }, e => {
            const lastIndex = this.messages.length - 1;
            const lastMessage = this.messages[lastIndex];
            lastMessage.payload = lastMessage.payload.concat(
              `Error: ${e.message}`,
            );
            lastMessage.type = 'error';
            this.messages[lastIndex] = lastMessage;
            this.emitMessagesChanged();
          })
          .exhaustive();
      }
    } finally {
      this.saveToStorage();
    }
  }

  clear(): void {
    if (this.sessionId) {
      this.agentApi.endSession({
        agentName: this.agentName,
        sessionId: this.sessionId,
      });
    }

    this.messages = [];
    this.emitMessagesChanged();
    this.sessionId = undefined;
    this.storage.clearStorage(
      this.messagesStorageKey,
      this.sessionIdStorageKey,
    );
  }
}
