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

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../components/types';
import { useApi } from '@backstage/core-plugin-api';
import { agentApiRef } from '../api';
import { ChatSessionManager } from '../lib';

interface UseChatSessionProps {
  agentName: string;
}

interface UseChatSessionResult {
  messages: ChatMessage[];
  isLoading: boolean;
  onUserMessage: (userMessage: string) => Promise<void>;
  onClear: () => void;
}

export const useChatSession = ({
  agentName,
}: UseChatSessionProps): UseChatSessionResult => {
  const agentApi = useApi(agentApiRef);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [chatManager] = useState(
    () =>
      new ChatSessionManager(agentApi, agentName, event => {
        if (event.type === 'messagesChanged') {
          setMessages(event.messages);
        }
      }),
  );

  useEffect(() => {
    chatManager.loadFromStorage();
    setMessages(chatManager.getMessages());
  }, [chatManager]);

  const onUserMessage = useCallback(
    async (userMessage: string) => {
      setIsLoading(true);
      try {
        await chatManager.sendUserMessage(userMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [chatManager],
  );

  const onClear = useCallback(() => {
    chatManager.clear();
    setIsLoading(false);
  }, [chatManager]);

  return {
    messages,
    isLoading,
    onUserMessage,
    onClear,
  };
};
