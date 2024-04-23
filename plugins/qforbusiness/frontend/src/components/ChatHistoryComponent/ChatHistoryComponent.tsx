import { EmptyState, MarkdownContent } from '@backstage/core-components';
import React, { useEffect, useRef } from 'react';

import style from './ChatHistoryComponent.module.css';
import { ChatHistoryToolbar } from './ChatHistoryToolbar';
import chatBotLogo from '../../assets/assistant-logo.svg';
import { ChatMessage } from '../types';

export interface ChatHistoryComponentProps {
  messages?: ChatMessage[];
  isStreaming?: boolean;
  onClear?: () => void;
  className?: string;
}

export const ChatHistoryComponent = ({
  messages,
  isStreaming,
  onClear,
  className,
}: ChatHistoryComponentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`${className} ${style.container}`}>
      <div className={style.markdownContainer}>
        <div className={style.markdown} ref={contentRef}>
          {messages!.length == 0 && (
            <EmptyState
              missing="data"
              title="Start chatting!"
              description="This assistant can answer questions for you, type a message below to get started."
            />
          )}

          {messages!.length > 0 &&
            messages?.map(message => (
              <div
                className={`${style.ChatItem} ${
                  message.user ? style.ChatItemCustomer : style.ChatItemExpert
                }`}
              >
                <div className={`${style.ChatItemMeta}`}>
                  <div className={`${style.ChatItemAvatar}`}>
                    {!message.user && (
                      <img
                        className={`${style.ChatItemAvatarImage}`}
                        src={chatBotLogo}
                      />
                    )}
                  </div>
                </div>
                <div className={`${style.ChatItemContent}`}>
                  <div className={`${style.ChatItemChatText}`}>
                    <MarkdownContent
                      content={
                        message.payload.length == 0 ? '...' : message.payload
                      }
                      className={style.markdownChat}
                      dialect="common-mark"
                    />
                  </div>
                  <div className={`${style.ChatItemTimeStamp}`}>
                    <strong>{message.user ? 'You' : 'Assistant'}</strong>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      <ChatHistoryToolbar isStreaming={isStreaming} onClear={onClear} />
    </div>
  );
};
