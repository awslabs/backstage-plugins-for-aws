/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface ChatRequest {
  userMessage: string;
  sessionId: string | undefined;
  agentName: string;
}

export interface GenerateRequest {
  prompt: string;
  agentName: string;
}

export interface AgentRequestOptions {
  token: string;
}

export interface GenerateResponse {
  output: any;
}

export interface EndSessionRequest {
  sessionId: string;
  agentName: string;
}

export interface ChatSession {
  sessionId: string;
  principal: string;
  agent: string;
  created: Date;
  lastActivity: Date;
  ended?: Date;
}
