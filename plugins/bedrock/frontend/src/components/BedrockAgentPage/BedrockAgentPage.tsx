import { useApi } from '@backstage/core-plugin-api';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import React, { useState } from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { ChatMessage } from '../types';
import { amazonBedrockAgentApiRef } from '../../api';

import style from './style.module.css';

export const BedrockAgentPage = () => {
  const amazonBedrockAgentApi = useApi(amazonBedrockAgentApiRef);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(false);

  const onUserMessage = async (userMessage: string) => {
    const updatedMessages = [...messages, { payload: userMessage, user: true }];
    setMessages(updatedMessages);
    setIsLoading(true);
    const response = await amazonBedrockAgentApi.chatSync({
      userMessage,
      sessionId,
    });

    setSessionId(response.sessionId);
    const finalMessages = [
      ...updatedMessages,
      {
        payload: response.completion,
        user: false,
      },
    ];
    setMessages(finalMessages);
    setIsLoading(false);
  };

  const onClear = () => {
    setMessages([]);
    setIsLoading(false);
  };

  return (
    <Page themeId="tool">
      <Header title="Amazon Bedrock"></Header>
      <Content>
        <div className={style.flex}>
          <ChatHistoryComponent
            messages={messages}
            onClear={onClear}
            className={style.grow}
            isStreaming={isLoading}
          />
          <InfoCard className={style.fixed}>
            <ChatInputComponent
              onMessage={onUserMessage}
              disabled={isLoading}
            />
          </InfoCard>
        </div>
      </Content>
    </Page>
  );
};
