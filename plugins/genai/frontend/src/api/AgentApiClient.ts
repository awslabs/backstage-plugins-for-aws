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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

import { AgentApi } from './AgentApi';
import {
  EventSourceParserStream,
  ParsedEvent,
} from 'eventsource-parser/stream';
import {
  ChatEvent,
  ChatRequest,
  ChatSession,
  EndSessionRequest,
  EventSchema,
} from '@aws/genai-plugin-for-backstage-common';

export class AgentApiClient implements AgentApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async *chatSync(request: ChatRequest): AsyncGenerator<ChatEvent> {
    try {
      const stream = await this.fetch('v1/chat', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(request),
      });

      const reader = stream
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .pipeThrough(
          new TransformStream<ParsedEvent, ChatEvent>({
            transform(parsedEvent, controller) {
              // eslint-disable-next-line no-console
              const data = JSON.parse(parsedEvent.data);
              controller.enqueue(EventSchema.parse(data));
            },
          }),
        )
        .getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error(e.message);

      yield {
        type: 'ErrorEvent',
        message: e.message,
      };
    }
  }

  public async getUserSession(
    agent: string,
    sessionId: string,
  ): Promise<ChatSession | undefined> {
    return this.get<ChatSession>(`v1/session/${agent}/${sessionId}`, true);
  }

  public async endSession(request: EndSessionRequest): Promise<void> {
    await this.fetch('v1/endSession', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  private async getBaseUrl(): Promise<string> {
    return this.discoveryApi.getBaseUrl('aws-genai');
  }

  private async fetch(path: string, options: {} = {}) {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/${path}`, options);

    if (!response.ok) {
      throw new Error(`Failed to retrieved data from path ${path}`);
    }

    return response.body!;
  }

  private async get<T>(
    path: string,
    handleMissing: boolean,
  ): Promise<T | undefined> {
    const baseUrl = await this.getBaseUrl();

    const response = await this.fetchApi.fetch(`${baseUrl}/${path}`);

    if (!response.ok) {
      if (response.status === 404 && handleMissing) {
        return undefined;
      }

      throw Error(response.statusText);
    }

    return response.json() as Promise<T>;
  }
}
