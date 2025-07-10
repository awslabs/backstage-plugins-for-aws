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

import { ChatMessage, ToolRecord } from '../types';
import { Avatar } from '@material-ui/core';
import Person from '@material-ui/icons/Person';
import School from '@material-ui/icons/School';
import Info from '@material-ui/icons/Info';
import Error from '@material-ui/icons/Error';
import { ToolsModal } from './ToolsModal';
import { makeStyles } from '@material-ui/core';
import { AgentUIConfig } from '../../hooks';

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },

  markdownContainer: {
    flexGrow: 1,
    position: 'relative',
  },

  markdown: {
    position: 'absolute',
    left: 0,
    top: '1rem',
    right: 0,
    bottom: '1rem',
    padding: '0 2rem',
    overflow: 'auto',
  },

  ChatItem: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: '1rem',
    fontSize: '16px',
    background: theme.palette.background.default,
    borderRadius: '7px',
    padding: '10px',

    '& $ChatItemAvatarIcon': {
      backgroundColor: theme.palette.type === 'dark' ? '#B3B3B3' : '#757575',
    },
  },

  ChatItemExpert: {
    background: theme.palette.background.paper,

    '& $ChatItemAvatarIcon': {
      backgroundColor: '#f59d12',
    },
  },

  ChatItemCustomer: {},

  ChatItemMeta: {
    display: 'flex',
    alignItems: 'center',
    flex: '0 1 auto',
    marginRight: '1rem',
    marginBottom: '0.5rem',
    width: '2.5rem',
  },

  ChatItemContent: {
    position: 'relative',
    flex: '1 0 auto',
    width: '100%',
  },

  ChatItemToolIcon: {
    marginTop: '20px',
    cursor: 'pointer',
  },

  ChatItemAvatarContainer: {
    marginTop: '10px',
    marginBottom: '10px',
    width: '100px',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ChatItemAvatarIcon: {
    color: theme.palette.text.primary,
  },

  ChatItemChatText: {
    position: 'relative',
    width: '100%',
    lineHeight: '1.3',
    marginTop: '5px',
  },

  ChatItemError: {
    background: '#fcf2f2',
    color: '#5b2e2e',

    '& $ChatItemAvatarIcon': {
      backgroundColor: '#5b2e2e',
    },
  },
}));

export interface ChatHistoryComponentProps {
  messages?: ChatMessage[];
  isStreaming?: boolean;
  className?: string;
  showInformation: boolean;
  agentMetadata?: AgentUIConfig;
}

function getMessageExtraClass(message: ChatMessage, classes: any): string {
  if (message.type === 'user') {
    return classes.ChatItemCustomer;
  }

  if (message.type === 'error') {
    return classes.ChatItemError;
  }

  return classes.ChatItemExpert;
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
  showInformation,
  agentMetadata,
}: ChatHistoryComponentProps) => {
  const classes = useStyles();

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
    <div className={`${className} ${classes.container}`}>
      <div className={classes.markdownContainer}>
        <div className={classes.markdown} ref={contentRef}>
          {messages!.length === 0 && (
            <EmptyState
              missing="content"
              title={agentMetadata?.description || 'Start chatting!'}
              description={
                <MarkdownContent
                  content={
                    agentMetadata?.welcomeMessage ||
                    'This assistant can answer questions for you, type a message below to get started.'
                  }
                />
              }
            />
          )}

          {messages!.length > 0 &&
            messages?.map((message, index) => (
              <div
                key={index}
                className={`${classes.ChatItem} ${getMessageExtraClass(
                  message,
                  classes,
                )}`}
              >
                <div className={`${classes.ChatItemAvatarContainer}`}>
                  <div>
                    <Avatar className={classes.ChatItemAvatarIcon}>
                      {getMessageIcon(message)}
                    </Avatar>
                  </div>
                  {message.tools.length > 0 && showInformation && (
                    <Info
                      className={classes.ChatItemToolIcon}
                      onClick={() => handleOpen(message)}
                    />
                  )}
                </div>
                <div className={`${classes.ChatItemChatText}`}>
                  <MarkdownContent
                    content={
                      message.payload.length === 0 ? '...' : message.payload
                    }
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
