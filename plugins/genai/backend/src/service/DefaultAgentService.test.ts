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

import { DefaultAgentService } from './DefaultAgentService';
import { Agent } from '../agent/Agent';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';

const loggerMock = mockServices.logger.mock();
const userInfoMock = mockServices.userInfo.mock({
  getUserInfo: jest.fn(_ => {
    return Promise.resolve({
      userEntityRef: 'user:default/guest',
      ownershipEntityRefs: [],
    });
  }),
});
const credentials = mockCredentials.user('user:default/guest');

describe('DefaultAgentService', () => {
  let agentMock: jest.Mocked<Agent>;
  let service: DefaultAgentService;

  beforeEach(() => {
    agentMock = {
      stream: jest.fn(),
      generate: jest.fn(),
    } as unknown as jest.Mocked<Agent>;

    const agents = new Map<string, Agent>([['testAgent', agentMock]]);
    service = new DefaultAgentService(loggerMock, userInfoMock, agents);
  });

  describe('stream', () => {
    it('should call agent.stream with correct parameters', async () => {
      const userMessage = 'Hello';
      const options = {
        agentName: 'testAgent',
        sessionId: 'test-session',
        credentials,
      };
      const mockStream = {} as ReadableStream<ChatEvent>;

      agentMock.stream.mockResolvedValue(mockStream);

      const result = await service.stream(userMessage, options);

      expect(agentMock.stream).toHaveBeenCalledWith(
        userMessage,
        'test-session',
        false,
        { kind: 'user', name: 'guest', namespace: 'default' },
        { credentials },
      );
      expect(result).toBe(mockStream);
    });

    it('should generate a new session ID if not provided', async () => {
      const userMessage = 'Hello';
      const options = { agentName: 'testAgent', credentials };

      agentMock.stream.mockResolvedValue({} as ReadableStream<ChatEvent>);

      await service.stream(userMessage, options);

      expect(agentMock.stream).toHaveBeenCalledWith(
        userMessage,
        expect.any(String),
        true,
        { kind: 'user', name: 'guest', namespace: 'default' },
        { credentials },
      );
    });

    it('should throw an error if specified agent is not found', async () => {
      const userMessage = 'Hello';
      const options = { agentName: 'nonExistentAgent', credentials };

      await expect(service.stream(userMessage, options)).rejects.toThrow(
        'Agent nonExistentAgent not found',
      );
    });
  });

  describe('generate', () => {
    it('should call agent.generate with correct parameters', async () => {
      const prompt = 'Test prompt';
      const options = { agentName: 'testAgent', credentials };

      agentMock.generate.mockResolvedValue({} as GenerateResponse);

      await service.generate(prompt, options);

      expect(agentMock.generate).toHaveBeenCalledWith(
        prompt,
        expect.any(String),
        true,
        { kind: 'user', name: 'guest', namespace: 'default' },
        { credentials },
      );
    });

    it('should throw an error if specified agent is not found', async () => {
      const prompt = 'Test prompt';
      const options = { agentName: 'nonExistentAgent' };

      await expect(service.generate(prompt, options)).rejects.toThrow(
        'Agent nonExistentAgent not found',
      );
    });
  });

  describe('getAgent', () => {
    it('should return the correct agent', () => {
      const result = service.getAgent('testAgent');
      expect(result).toBe(agentMock);
    });

    it('should return undefined for non-existent agent', () => {
      const result = service.getAgent('nonExistentAgent');
      expect(result).toBeUndefined();
    });
  });
});
