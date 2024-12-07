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

import { encodingForModel } from '@langchain/core/utils/tiktoken';
import {
  BaseMessage,
  MessageContent,
  MessageContentText,
} from '@langchain/core/messages';

async function strTokenCounter(
  messageContent: MessageContent,
): Promise<number> {
  if (typeof messageContent === 'string') {
    return (await encodingForModel('gpt-4')).encode(messageContent).length;
  }

  if (messageContent.every(x => x.type === 'text' && x.text)) {
    return (await encodingForModel('gpt-4')).encode(
      (messageContent as MessageContentText[]).map(({ text }) => text).join(''),
    ).length;
  }
  throw new Error(
    `Unsupported message content ${JSON.stringify(messageContent)}`,
  );
}

export async function tiktokenCounter(
  messages: BaseMessage[],
): Promise<number> {
  let numTokens = 3;
  const tokensPerMessage = 3;
  const tokensPerName = 1;
  const roleBuffer = 20; // Hardcoded buffer for role string

  for (const msg of messages) {
    numTokens +=
      tokensPerMessage + roleBuffer + (await strTokenCounter(msg.content));

    if (msg.name) {
      numTokens += tokensPerName + (await strTokenCounter(msg.name));
    }
  }

  return numTokens;
}
