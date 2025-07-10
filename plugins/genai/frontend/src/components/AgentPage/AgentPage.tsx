// plugins/genai/frontend/src/components/AgentPage/AgentPage.tsx
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
import React from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { useParams } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import { useChatSession } from '../../hooks';
import { useAgentMetadata } from '../../hooks/useAgentMetadata';

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

  const config = useApi(configApiRef);
  const showInformation =
    config.getOptionalBoolean('genai.chat.showInformation') ?? false;

  const params = useParams() as { agentName: string };
  const agentName = params.agentName;

  if (!agentName) {
    throw new Error('agent name is not defined');
  }

  const agentMetadata = useAgentMetadata(agentName);
  const agentTitle = agentMetadata.title || title;

  const { messages, isLoading, onUserMessage, onClear } = useChatSession({
    agentName,
  });

  return (
    <Page themeId="tool">
      <Header title={agentTitle} />
      <Content>
        <div className={classes.flex}>
          <ChatHistoryComponent
            messages={messages}
            className={classes.grow}
            isStreaming={isLoading}
            showInformation={showInformation}
            agentMetadata={agentMetadata}
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
