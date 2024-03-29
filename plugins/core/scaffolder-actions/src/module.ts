import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import {
  createAwsCloudControlCreateAction,
  createAwsCodeCommitPublishAction,
  createAwsEventBridgeEventAction,
  createAwsS3CpAction,
} from './actions';

export const awsCoreScaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'aws-core',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        const awsCredentialsManager =
          DefaultAwsCredentialsManager.fromConfig(config);
        scaffolder.addActions(
          createAwsCloudControlCreateAction({
            credsManager: awsCredentialsManager,
          }),
          createAwsCodeCommitPublishAction({
            credsManager: awsCredentialsManager,
          }),
          createAwsEventBridgeEventAction({
            credsManager: awsCredentialsManager,
          }),
          createAwsS3CpAction({ credsManager: awsCredentialsManager }),
        );
      },
    });
  },
});
