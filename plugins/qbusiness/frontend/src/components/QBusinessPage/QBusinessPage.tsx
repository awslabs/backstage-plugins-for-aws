import { useApi } from '@backstage/core-plugin-api';
import { Page, Header, Content, InfoCard } from '@backstage/core-components';
import React, { useState } from 'react';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { ChatMessage } from '../types';
import { amazonQBusinessApiRef } from '../../api';

import style from './style.module.css';

export const QBusinessPage = () => {
  const amazonQBusinessApi = useApi(amazonQBusinessApiRef);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [previousMessageId, setPreviousMessageId] = useState<string>();

  const [isLoading, setIsLoading] = useState(false);

  const onUserMessage = async (userMessage: string) => {
    const updatedMessages = [...messages, { payload: userMessage, user: true }];
    setMessages(updatedMessages);
    setIsLoading(true);
    const response = await amazonQBusinessApi.chatSync({
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
    setIsLoading(false);
    setPreviousMessageId(response.response.systemMessageId);
  };

  const onClear = () => {
    setMessages([]);
    setIsLoading(false);
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
