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

import { LangfuseSpanProcessor } from '@langfuse/otel';
import { setLangfuseTracerProvider } from '@langfuse/tracing';
import { context, createContextKey } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { LangGraphAgentLangFuseConfig } from './config';

const contextProbe = createContextKey('aws-genai-langfuse-context-probe');

/**
 * Whether an OpenTelemetry context manager is active. Without one,
 * `context.with()` is a no-op and values set on a context are not visible
 * inside the callback.
 */
function hasActiveContextManager(): boolean {
  return context.with(context.active().setValue(contextProbe, true), () =>
    Boolean(context.active().getValue(contextProbe)),
  );
}

/**
 * Registers the Langfuse span processor for this backend.
 *
 * With the Langfuse JS SDK v5, the span processor owns the credentials and
 * export settings, and each `CallbackHandler` only carries trace attributes.
 * The tracer provider is registered with the Langfuse SDK only, so it does not
 * replace an OpenTelemetry setup the Backstage backend may already have.
 *
 * @returns A function that flushes pending spans and shuts the processor down.
 */
export function registerLangfuseTracing(
  config: LangGraphAgentLangFuseConfig,
): () => Promise<void> {
  const processor = new LangfuseSpanProcessor({
    baseUrl: config.baseUrl,
    publicKey: config.publicKey,
    secretKey: config.secretKey,
    flushAt: config.flushAt,
  });

  const provider = new BasicTracerProvider({ spanProcessors: [processor] });
  setLangfuseTracerProvider(provider);

  // The Langfuse CallbackHandler sets the user, session and tags on the root
  // run with propagateAttributes(), which carries them through the
  // OpenTelemetry context. Register a context manager unless the backend
  // already runs one, for example through its own OpenTelemetry setup.
  if (!hasActiveContextManager()) {
    context.setGlobalContextManager(
      new AsyncLocalStorageContextManager().enable(),
    );
  }

  return () => provider.shutdown();
}
