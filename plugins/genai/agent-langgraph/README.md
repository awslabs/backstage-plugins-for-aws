# Generative AI plugin for Backstage - LangGraph Agent Type

This package implements an agent for the Generative AI plugin for Backstage based on [LangGraph.js](https://github.com/langchain-ai/langgraphjs).

Features:

1. [ReAct pattern](https://react-lm.github.io/) to use available tools to answer prompts
1. Choose between Amazon Bedrock or OpenAI as the model provider
1. Integrate with [LangFuse](https://github.com/langfuse/langfuse) for observability

Limitations:

1. In-memory persistence only: Chat sessions only persist in-memory

## Configuration

This agent can be configured at two different levels, global and per-agent

### Global

Global configuration values apply to all agents, all of this is optional:

```yaml
genai:
  langgraph:
    langfuse: # (Optional) Configuration for LangFuse observability
      baseUrl: http://localhost:3001 # (Required) LangFuse URL
      publicKey: pk-aaa # (Required) Public key
      secretKey: sk-bbb # (Required) Secret key
```

### Per-agent

Per-agent configuration only applies to the agent for which it corresponds. The available parameters are:

```yaml
genai:
  agents:
    general:
      description: [...]
      prompt: [...]
      langgraph:
        messagesMaxTokens: 100000 # (Required) Prune message history to maximum of this number of tokens
        temperature: 0 # (Optional) Model temperature
        maxTokens: 4000 # (Optional) Maximum output tokens
        topP: 0.9 # (Optional) Model topP
        # Only include the subsequent section for your model provider
        # Bedrock only
        bedrock:
          modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0' # (Required) Bedrock model ID
          region: us-west-2 # (Required) Bedrock AWS region
        # OpenAI only
        openai:
          baseUrl: ${OPENAI_API_BASE_URL}
          apiKey: ${OPENAI_API_KEY} # (Required) OpenAI model name
          modelName: 'gpt-3.5-turbo-instruct' # (Optional) OpenAI model name
```
