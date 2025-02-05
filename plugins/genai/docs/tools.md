# Tools

The term "tool use" or "function calling" describes a mechanism where an LLM is provided functions it can request to call for things like getting additional context or taking actions. When using this approach LLMs will generally apply patterns such as ["chain of thought"](https://www.ibm.com/topics/chain-of-thoughts) to break a user prompt in to a number of separate steps that can be fulfilled by the tools it has been provided.

## Existing tools

| Package    | Tools name                | Description                                                          |
| ---------- | ------------------------- | -------------------------------------------------------------------- |
| (built-in) | `backstageCatalogSearch`  | Search the Backstage catalog using the Search API                    |
|            | `backstageEntity`         | Retrieve information about a specific entity through the Catalog API |
|            | `backstageTechDocsSearch` | Search TechDocs documentation using the Search API                   |

## Creating tools

This plugin provides a Backstage extension point to register additional tools which agents can use. Tools must implement the LangChain [`ToolInterface`](https://v03.api.js.langchain.com/interfaces/_langchain_core.tools.ToolInterface.html) interface, which can be done in several ways. The most common would be to use the [`DynamicStructuredTool`](https://v03.api.js.langchain.com/classes/_langchain_core.tools.DynamicStructuredTool.html) class, which allows the specification of a schema and implementation.

See [this guide](https://js.langchain.com/docs/how_to/custom_tools) for creating tools.

Registering tools with the plugin is done like so:

```typescript
import {
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { agentToolExtensionPoint } from '@aws/genai-plugin-for-backstage-node';

export const genAiPluginForBackstageModuleExampleTools = createBackendModule({
  pluginId: 'aws-genai',
  moduleId: '<your module id>',
  register(reg) {
    reg.registerInit({
      deps: {
        [...]
      },
      async init({ [...] }) {
        agentToolFunctions.addTools(
          <your tool>
        );
      },
    });
  },
});
```

See the existing tools in this repository for concrete implementations.
