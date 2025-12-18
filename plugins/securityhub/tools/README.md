# AWS SecurityHub Agent Actions

This module provides GenAI agent actions for AWS Security Hub integration using the Backstage actionsRegistry pattern.

## Available Action

### `aws-securityhub-findings`

Retrieves AWS Security Hub findings for a catalog entity.

**Parameters:**
- `entityName` (required): Entity name as it appears in the Backstage catalog
- `kind` (required): Entity kind as it appears in the Backstage catalog
- `namespace` (required): Entity namespace as it appears in the Backstage catalog
- `findingId` (optional): Security Hub finding ID to filter results

**Returns:** Formatted summary of security findings including title, ID, severity, description, remediation URL, creation date, and AWS account ID.

## Setup

The tool is already registered in your backend at `packages/backend/src/index.ts`:

```typescript
backend.add(
  import('@aws/aws-securityhub-plugin-for-backstage-tools'),
);
```

## Configuration

Add the action to your GenAI agent configuration in `app-config.yaml`:

```yaml
genai:
  agents:
    general:
      description: AWS platform analysis and remediation assistant
      prompt: |
        You are an AWS platform expert assistant helping developers understand and remediate 
        AWS platform issues. Provide clear, actionable guidance with code examples when appropriate.
        Focus on practical remediation steps that can be implemented immediately.
      langgraph:
        messagesMaxTokens: 15000 # optional
        bedrock:
          modelId: amazon.nova-lite-v1:0 # or other model
          region: us-east-1
      actions:
        - get-catalog-entity
        - search-catalog
        - aws-securityhub-findings
```

You can add default actions `get-catalog-entity`, `search-catalog` to the action list and the agent will fetch entities automatically. Without that, you need to specify the full entityRef in your question.

## Testing

Start Backstage and use the GenAI chat interface:

```bash
yarn dev
```

Ask questions like:
- "What security findings does the component example-web have?"
- "Show me all critical security findings for a component example-service"

The agent will automatically call the `aws-securityhub-findings` action.

In case, you don't use default Backstage actions, you need to specify the full entityRef in your question like:
- "What security findings does the component component:default/example-web have?"

## Troubleshooting

**Action Not Available:** Verify the module is imported in `packages/backend/src/index.ts` and listed in your agent's `actions` configuration.

**No Findings:** Ensure Security Hub is enabled and the entity's resources are being scanned.

**Permissions:** AWS credentials need `securityhub:GetFindings` and `securityhub:DescribeHub`.
