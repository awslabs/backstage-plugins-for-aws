# Agent implementation

For the purposes of this plugin we'll consider LLM agents to be AI tools that display a certain amount of reasoning capabilities and memory, with the ability to perform tasks and interact with other systems autonomously.

As this space is rapidly evolving, this plugin takes no opinionated stance on how agents should be implemented. It can also be desirable to provide different implementations of agents for specific purposes.

An agent implementation needs to implement the [AgentType](./node/src/types.ts) interface, which has two functions:

1. A `stream` function for chat, session-based use-cases
2. A `generate` function for transactional use-cases

The [LangGraph agent implementation](../agent-langgraph/) can be used as a reference.

Agents are expected to:

1. Apply configuration such as the system prompt
1. Appropriately invoke the list of tools provided
1. Provide "memory" of message history
