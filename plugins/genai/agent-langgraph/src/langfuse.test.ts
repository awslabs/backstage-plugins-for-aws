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

import { CallbackHandler } from '@langfuse/langchain';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import { registerLangfuseTracing } from './langfuse';

const mockExporter = new InMemorySpanExporter();

// The real span processor, with an in-memory exporter in place of the OTLP
// exporter.
jest.mock('@langfuse/otel', () => {
  const actual = jest.requireActual('@langfuse/otel');
  return {
    ...actual,
    LangfuseSpanProcessor: jest.fn().mockImplementation(
      params =>
        new actual.LangfuseSpanProcessor({
          ...params,
          exporter: mockExporter,
          exportMode: 'immediate',
        }),
    ),
  };
});

describe('registerLangfuseTracing', () => {
  // The backend module registers the processor once per process, so the tests
  // do the same.
  let shutdown: () => Promise<void>;

  beforeAll(() => {
    shutdown = registerLangfuseTracing({
      baseUrl: 'https://cloud.langfuse.com',
      publicKey: 'pk-lf-test',
      secretKey: 'sk-lf-test',
      flushAt: 5,
    });
  });

  afterAll(() => shutdown());

  it('passes the Langfuse settings to the span processor', () => {
    expect(LangfuseSpanProcessor).toHaveBeenCalledTimes(1);
    expect(LangfuseSpanProcessor).toHaveBeenCalledWith({
      baseUrl: 'https://cloud.langfuse.com',
      publicKey: 'pk-lf-test',
      secretKey: 'sk-lf-test',
      flushAt: 5,
    });
  });

  it('exports a LangChain run with the session and user on its root span', async () => {
    // The agent runs a LangGraph graph, so the model call sits under a root
    // chain. The handler sets user, session and tags on that root chain.
    const chain = ChatPromptTemplate.fromTemplate('{question}').pipe(
      new FakeListChatModel({ responses: ['hello'] }),
    );
    await chain.invoke(
      { question: 'hi' },
      {
        callbacks: [
          new CallbackHandler({
            sessionId: 'session-1',
            userId: 'user:default/guest',
          }),
        ],
      },
    );

    const spans = mockExporter.getFinishedSpans();
    const root = spans.find(span => !span.parentSpanContext);

    expect(
      spans.some(
        span => span.attributes['langfuse.observation.type'] === 'generation',
      ),
    ).toBe(true);
    // Without a context manager, propagateAttributes() is a no-op and no span
    // carries the user or session.
    expect(root?.attributes).toMatchObject({
      'session.id': 'session-1',
      'user.id': 'user:default/guest',
    });
  });
});
