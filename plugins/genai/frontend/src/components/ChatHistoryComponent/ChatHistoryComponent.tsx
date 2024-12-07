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

import { EmptyState, MarkdownContent } from '@backstage/core-components';
import React, { useEffect, useRef } from 'react';

import style from './ChatHistoryComponent.module.css';
import { ChatMessage, ToolRecord } from '../types';
import { Avatar } from '@material-ui/core';
import Person from '@material-ui/icons/Person';
import School from '@material-ui/icons/School';
import Info from '@material-ui/icons/Info';
import Error from '@material-ui/icons/Error';
import { ToolsModal } from './ToolsModal';

export interface ChatHistoryComponentProps {
  messages?: ChatMessage[];
  isStreaming?: boolean;
  className?: string;
}

function getMessageExtraClass(message: ChatMessage): string {
  if (message.type === 'user') {
    return style.ChatItemCustomer;
  }

  if (message.type === 'error') {
    return style.ChatItemError;
  }

  return style.ChatItemExpert;
}

function getMessageIcon(message: ChatMessage) {
  if (message.type === 'user') {
    return <Person />;
  }

  if (message.type === 'error') {
    return <Error />;
  }

  return <School />;
}

export const ChatHistoryComponent = ({
  messages,
  className,
}: ChatHistoryComponentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  const [open, setOpen] = React.useState(false);
  const [tools, setTools] = React.useState<ToolRecord[]>([]);

  const handleOpen = (message: ChatMessage) => {
    setOpen(true);
    setTools(message.tools);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className={`${className} ${style.container}`}>
      <div className={style.markdownContainer}>
        <div className={style.markdown} ref={contentRef}>
          {messages!.length === 0 && (
            <EmptyState
              missing="data"
              title="Start chatting!"
              description="This assistant can answer questions for you, type a message below to get started."
            />
          )}

          {messages!.length > 0 &&
            messages?.map((message, index) => (
              <div
                key={index}
                className={`${style.ChatItem} ${getMessageExtraClass(message)}`}
              >
                <div className={`${style.ChatItemAvatarContainer}`}>
                  <div>
                    <Avatar className={style.ChatItemAvatarIcon}>
                      {getMessageIcon(message)}
                    </Avatar>
                  </div>
                  {message.tools.length > 0 && (
                    <Info
                      className={style.ChatItemToolIcon}
                      onClick={() => handleOpen(message)}
                    />
                  )}
                </div>
                <div className={`${style.ChatItemChatText}`}>
                  <MarkdownContent
                    content={
                      message.payload.length === 0 ? '...' : message.payload
                    }
                    className={style.markdownChat}
                    dialect="gfm"
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
      <ToolsModal open={open} onClose={handleClose} tools={tools} />
    </div>
  );
};
