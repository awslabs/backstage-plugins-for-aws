import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';
import { awsSecurityHubApiServiceRef } from '@aws/aws-securityhub-plugin-for-backstage-backend';

export const genAiPluginForBackstageModuleSecHubTools = createBackendModule({
  pluginId: 'aws-genai',
  moduleId: 'securityhub-tools',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        actionsRegistry: actionsRegistryServiceRef,
        awsSecurityHubApi: awsSecurityHubApiServiceRef,
      },
      async init({ actionsRegistry, awsSecurityHubApi }) {
        actionsRegistry.register({
          name: 'aws-securityhub-findings',
          title: 'AWS Security Hub Findings',
          attributes: {
            destructive: false,
            readOnly: true,
            idempotent: true,
          },
          description:
            'Provides information regarding AWS Security Hub findings for a given entity in the Backstage catalog. Returns a formatted summary of security findings including title, severity, description, and remediation information.',
          schema: {
            input: z =>
              z.object({
                entityName: z
                  .string()
                  .describe('Entity name as it appears in the Backstage catalog'),
                kind: z
                  .string()
                  .describe('Entity kind as it appears in the Backstage catalog'),
                namespace: z
                  .string()
                  .describe(
                    'Entity namespace as it appears in the Backstage catalog',
                  ),
                findingId: z
                  .string()
                  .describe('Security Hub finding ID to retrieve information for')
                  .optional(),
              }),
            output: z =>
              z.object({
                response: z.string().describe('Formatted security findings summary'),
              }),
          },
          action: async ({ input, credentials }) => {
            const { entityName, kind, namespace, findingId } = input;

            let results = await awsSecurityHubApi.getFindingsByEntity({
              entityRef: {
                kind,
                namespace,
                name: entityName,
              },
              credentials,
            });

            if (findingId) {
              results = results.filter(e => e.Id === findingId);
            }

            // Return formatted string summary instead of large JSON array
            const summary = results
              .map(e => {
                const severityLabel = e.Severity?.Label || 'UNKNOWN';
                const remediationUrl =
                  e.Remediation?.Recommendation?.Url || 'N/A';
                return [
                  `Title: ${e.Title}`,
                  `ID: ${e.Id}`,
                  `Severity: ${severityLabel}`,
                  `Description: ${e.Description}`,
                  `Remediation: ${remediationUrl}`,
                  `Created: ${e.CreatedAt}`,
                  `Account: ${e.AwsAccountId}`,
                  '---',
                ].join('\n');
              })
              .join('\n');

            return {
              output: {
                response: `Found ${results.length} security finding(s):\n\n${summary}`,
              },
            };
          },
        });
      },
    });
  },
});
