/* eslint-disable no-console */
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

      try {
        const response = await fetch(
          'http://localhost:7007/api/proxy/question_answer',
          {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              team_ref: agentName,
              collection: 'techdocs_collection',
              question: userMessage,
              session_id: sessionId || 'd1b389f3-31a0-494f-b619-2e14768064f6',
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        // Atualiza a mensagem do agente com a resposta
        setMessages(oldMessages => {
          const lastMessage = oldMessages[oldMessages.length - 1];

          // Usa o campo answer da resposta
          lastMessage.payload = data.answer || 'No response received';

          // Adiciona referências de documentos se existirem
          if (data.documents && data.documents.length > 0) {
            lastMessage.tools = data.documents.map((doc: any) => ({
              name: doc.metadata?.document?.name || 'Reference',
              url: doc.metadata?.document?.url || '',
              type: 'link',
              description: doc.metadata?.entity_owner || '',
            }));
          }

          return [...oldMessages.slice(0, -1), lastMessage];
        });

        // Atualiza o sessionId se estiver na resposta
        if (data.session_id) {
          setSessionId(data.session_id);
        }
      } catch (error) {
        // Tratamento de erro
        setMessages(oldMessages => {
          const lastMessage = oldMessages[oldMessages.length - 1];
          console.error('Error processing request:', error);
          lastMessage.payload = `Error: ${
            error instanceof Error ? error.message : 'Unknown error occurred'
          }`;
          lastMessage.type = 'error';

          return [...oldMessages.slice(0, -1), lastMessage];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [agentName, sessionId],
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
            showInformation
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
