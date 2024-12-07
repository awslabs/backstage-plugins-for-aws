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

import { useApi } from '@backstage/core-plugin-api';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import React, { useCallback, useState } from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { ChatMessage } from '../types';
import { agentApiRef } from '../../api';
import { match } from 'ts-pattern';

import style from './style.module.css';
import { useParams } from 'react-router-dom';

export const AgentPage = () => {
  const agentApi = useApi(agentApiRef);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);

  const params = useParams() as { agentName: string };
  const agentName = params.agentName;

  const onUserMessage = useCallback(
    async (userMessage: string) => {
      setMessages(value => [
        ...value,
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
      ]);
      setIsLoading(true);

      for await (const chunk of agentApi.chatSync({
        userMessage,
        sessionId,
        agentName,
      })) {
        match(chunk)
          .with({ type: 'ChunkEvent' }, e => {
            setMessages(oldMessages => {
              const lastMessage = oldMessages[oldMessages.length - 1];
              lastMessage.payload = lastMessage.payload.concat(e.token);

              return [...oldMessages.slice(0, -1), lastMessage];
            });
          })
          .with({ type: 'ResponseEvent' }, e => {
            setSessionId(e.sessionId);
          })
          .with({ type: 'ToolEvent' }, e => {
            setMessages(oldMessages => {
              const lastMessage = oldMessages[oldMessages.length - 1];
              lastMessage.tools.push(e);

              return [...oldMessages.slice(0, -1), lastMessage];
            });
          })
          .with({ type: 'ErrorEvent' }, e => {
            setMessages(oldMessages => {
              const lastMessage = oldMessages[oldMessages.length - 1];
              lastMessage.payload = lastMessage.payload.concat(
                `Error: ${e.message}`,
              );
              lastMessage.type = 'error';

              return [...oldMessages.slice(0, -1), lastMessage];
            });
          })
          .exhaustive();
      }

      setIsLoading(false);
    },
    [agentApi, sessionId, agentName],
  );

  const onClear = () => {
    setMessages([]);
    setIsLoading(false);
    setSessionId(undefined);
  };

  if (!agentName) {
    throw new Error('agent name is not defined');
  }

  return (
    <Page themeId="tool">
      <Header title="Chat Assistant" />
      <Content>
        <div className={style.flex}>
          <ChatHistoryComponent
            messages={messages}
            className={style.grow}
            isStreaming={isLoading}
          />
          <InfoCard className={style.fixed}>
            <ChatInputComponent
              onMessage={onUserMessage}
              disabled={isLoading}
              onClear={onClear}
            />
          </InfoCard>
        </div>
      </Content>
    </Page>
  );
};
