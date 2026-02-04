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

import { ChatEvent } from '@aws/genai-plugin-for-backstage-common';
import { AIMessageChunk } from '@langchain/core/messages';
import { StreamEvent } from '@langchain/core/tracers/log_stream';

export class ResponseTransformStream extends TransformStream<
  StreamEvent,
  ChatEvent
> {
  constructor(sessionId: string) {
    super({
      start: controller => {
        controller.enqueue({
          type: 'ResponseEvent',
          sessionId,
        });
      },
      transform: (chunk, controller) => this.transform(chunk, controller),
      flush: controller => this.flush(controller),
    });
  }

  transform(
    chunk: StreamEvent,
    controller: TransformStreamDefaultController<ChatEvent>,
  ) {
    const event = chunk.event;
    const data = chunk.data;

    if (event === 'on_chat_model_stream') {
      const msg = data.chunk as AIMessageChunk;
      if (!msg.tool_call_chunks?.length) {
        const content = msg.content;

        controller.enqueue({
          type: 'ChunkEvent',
          token: content.toString(),
        });
      }
    } else if (event === 'on_chat_model_end') {
      controller.enqueue({
        type: 'ChunkEvent',
        token: '\n\n',
      });
    } else if (event === 'on_tool_start') {
      const msg = data;

      controller.enqueue({
        type: 'ToolEvent',
        name: chunk.name,
        input: msg.input.input,
      });
    }
  }

  flush(controller: TransformStreamDefaultController<ChatEvent>) {
    controller.terminate();
  }
}
