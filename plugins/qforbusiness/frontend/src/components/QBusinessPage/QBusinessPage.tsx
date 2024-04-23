import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import React, { useState } from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';

import style from './style.module.css';
import { AmazonQApiClient } from '../../api/AmazonQApiClient';
import { ChatMessage } from '../types';

export const AmazonQComponent = () => {
  const configApi = useApi(configApiRef);
  const client = new AmazonQApiClient({ configApi });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [previousMessageId, setPreviousMessageId] = useState<string>();

  const [isStreaming, setIsStreaming] = useState(false);

  const onUserMessage = async (userMessage: string) => {
    const updatedMessages = [...messages, { payload: userMessage, user: true }];
    setMessages(updatedMessages);
    setIsStreaming(true);
    const response = await client.chatSync({
      userMessage,
      conversationId,
      previousMessageId,
    });

    setConversationId(response.response.conversationId);
    const finalMessages = [
      ...updatedMessages,
      {
        payload: response.response.systemMessage!,
        user: false,
      },
    ];
    setMessages(finalMessages);
    setIsStreaming(false);
    setPreviousMessageId(response.response.systemMessageId);
  };

  const onClear = () => {
    setMessages([]);
    setIsStreaming(false);
  };

  return (
    <Page themeId="tool">
      <Header title="Amazon Q"></Header>
      <Content>
        <div className={style.flex}>
          <ChatHistoryComponent
            messages={messages}
            onClear={onClear}
            className={style.grow}
            isStreaming={isStreaming}
          />
          <InfoCard className={style.fixed}>
            <ChatInputComponent
              onMessage={onUserMessage}
              disabled={isStreaming}
            />
          </InfoCard>
        </div>
      </Content>
    </Page>
  );
};
