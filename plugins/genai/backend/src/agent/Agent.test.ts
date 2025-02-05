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

import { Agent } from './Agent';
import {
  AgentConfig,
  AgentTypeFactory,
} from '@aws/genai-plugin-for-backstage-node';
import { Toolkit } from '../tools/Toolkit';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';

const mockLogger = mockServices.logger.mock();
const mockConfig = new ConfigReader({});

describe('Agent', () => {
  describe('constructor', () => {
    it('should create an Agent instance', () => {
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        {} as any,
        mockLogger,
      );
      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getName()).toBe('TestAgent');
      expect(agent.getDescription()).toBe('Test Description');
    });
  });

  describe('fromConfig', () => {
    it('should create an Agent instance from config', async () => {
      const mockAgentConfig: AgentConfig = {
        name: 'TestAgent',
        prompt: 'test',
        description: 'Test Description',
        tools: ['tool1', 'tool2'],
        config: mockConfig,
      };
      const mockAgentTypeFactory = {
        create: jest.fn().mockResolvedValue({}),
      } as unknown as AgentTypeFactory;
      const mockToolkit = {
        getToolByName: jest.fn().mockReturnValue({}),
      } as unknown as Toolkit;

      const agent = await Agent.fromConfig(
        mockAgentConfig,
        mockAgentTypeFactory,
        mockToolkit,
        mockLogger,
      );

      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getName()).toBe('TestAgent');
      expect(agent.getDescription()).toBe('Test Description');
      expect(mockToolkit.getToolByName).toHaveBeenCalledTimes(2);
      expect(mockAgentTypeFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should create an Agent instance with empty tools array', async () => {
      const mockAgentConfig: AgentConfig = {
        name: 'EmptyToolsAgent',
        prompt: 'test',
        description: 'Agent with no tools',
        tools: [],
        config: mockConfig,
      };
      const mockAgentTypeFactory = {
        create: jest.fn().mockResolvedValue({}),
      } as unknown as AgentTypeFactory;
      const mockToolkit = {
        getToolByName: jest.fn(),
      } as unknown as Toolkit;

      const agent = await Agent.fromConfig(
        mockAgentConfig,
        mockAgentTypeFactory,
        mockToolkit,
        mockLogger,
      );

      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getName()).toBe('EmptyToolsAgent');
      expect(agent.getDescription()).toBe('Agent with no tools');
      expect(mockToolkit.getToolByName).not.toHaveBeenCalled();
      expect(mockAgentTypeFactory.create).toHaveBeenCalledTimes(1);
    });

    it('should throw an error for unknown tool', async () => {
      const mockAgentConfig: AgentConfig = {
        name: 'TestAgent',
        prompt: 'test',
        description: 'Test Description',
        tools: ['unknownTool'],
        config: mockConfig,
      };
      const mockAgentTypeFactory = {} as AgentTypeFactory;
      const mockToolkit = {
        getToolByName: jest.fn().mockReturnValue(null),
      } as unknown as Toolkit;

      await expect(
        Agent.fromConfig(
          mockAgentConfig,
          mockAgentTypeFactory,
          mockToolkit,
          mockLogger,
        ),
      ).rejects.toThrow('Unknown tool unknownTool');
    });
  });

  describe('getName', () => {
    it('should return the agent name', () => {
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        {} as any,
        mockLogger,
      );
      expect(agent.getName()).toBe('TestAgent');
    });
  });

  describe('getDescription', () => {
    it('should return the agent description', () => {
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        {} as any,
        mockLogger,
      );
      expect(agent.getDescription()).toBe('Test Description');
    });
  });

  describe('stream', () => {
    it('should call agentType.stream with correct parameters', async () => {
      const mockAgentType = {
        stream: jest.fn().mockResolvedValue(new ReadableStream()),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );
      const userMessage = 'Hello';
      const sessionId = 'session123';
      const newSession = true;
      const userEntityRef: CompoundEntityRef = {
        kind: 'User',
        namespace: 'default',
        name: 'testuser',
      };
      const options = {};

      await agent.stream(
        userMessage,
        sessionId,
        newSession,
        userEntityRef,
        options,
      );

      expect(mockAgentType.stream).toHaveBeenCalledWith(
        userMessage,
        sessionId,
        newSession,
        userEntityRef,
        mockLogger,
        options,
      );
    });

    it('should return a ReadableStream', async () => {
      const mockAgentType = {
        stream: jest.fn().mockResolvedValue(new ReadableStream()),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );

      const result = await agent.stream(
        'Hello',
        'session123',
        true,
        {} as CompoundEntityRef,
        {},
      );

      expect(result).toBeInstanceOf(ReadableStream);
    });

    it('should handle stream with no options', async () => {
      const mockAgentType = {
        stream: jest.fn().mockResolvedValue(new ReadableStream()),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );
      const userEntityRef: CompoundEntityRef = {
        kind: 'User',
        namespace: 'default',
        name: 'testuser',
      };

      await agent.stream('Hello', 'session123', false, userEntityRef, {});

      expect(mockAgentType.stream).toHaveBeenCalledWith(
        'Hello',
        'session123',
        false,
        userEntityRef,
        mockLogger,
        {},
      );
    });

    it('should handle errors from agentType.stream', async () => {
      const mockAgentType = {
        stream: jest.fn().mockRejectedValue(new Error('Stream error')),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );

      await expect(
        agent.stream('Hello', 'session123', true, {} as CompoundEntityRef, {}),
      ).rejects.toThrow('Stream error');
    });
  });

  describe('sync', () => {
    it('should call agentType.sync with correct parameters', async () => {
      const mockAgentType = {
        generate: jest.fn().mockResolvedValue({}),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );
      const userMessage = 'Hello';
      const sessionId = 'session123';
      const userEntityRef: CompoundEntityRef = {
        kind: 'User',
        namespace: 'default',
        name: 'testuser',
      };
      const options = {};

      await agent.generate(userMessage, sessionId, userEntityRef, options);

      expect(mockAgentType.generate).toHaveBeenCalledWith(
        userMessage,
        sessionId,
        userEntityRef,
        mockLogger,
        options,
      );
    });

    it('should handle errors from agentType.sync', async () => {
      const mockAgentType = {
        generate: jest.fn().mockRejectedValue(new Error('Sync error')),
      };
      const agent = new Agent(
        'TestAgent',
        'Test Description',
        mockAgentType as any,
        mockLogger,
      );

      await expect(
        agent.generate('Hello', 'session123', {} as CompoundEntityRef, {}),
      ).rejects.toThrow('Sync error');
    });
  });
});
