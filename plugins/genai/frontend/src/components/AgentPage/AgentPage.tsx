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

import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import React, { useCallback, useState } from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { ChatMessage } from '../types';
import { agentApiRef } from '../../api';
import { match } from 'ts-pattern';

import { useParams } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  flex: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
  },

  grow: {
    flexGrow: 1,
    minHeight: 'max-content',
    maxHeight: '100%',
    marginBottom: '1rem',
  },
});

export const AgentPage = ({ title = 'Chat Assistant' }: { title?: string }) => {
  const classes = useStyles();

  const agentApi = useApi(agentApiRef);
  const config = useApi(configApiRef);

  const showInformation =
    config.getOptionalBoolean('genai.chat.showInformation') ?? false;

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
      <Header title={title} />
      <Content>
        <div className={classes.flex}>
          <ChatHistoryComponent
            messages={messages}
            className={classes.grow}
            isStreaming={isLoading}
            showInformation={showInformation}
          />
          <InfoCard>
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
