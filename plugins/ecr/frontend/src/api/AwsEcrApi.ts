import { createApiRef } from '@backstage/core-plugin-api';
import { AwsEcrListImagesRequest, AwsEcrListImagesResponse, AwsEcrListScanResultsRequest, AwsEcrListScanResultsResponse } from '@aws/ecr-plugin-for-backstage-backend';

/** @public */
export const awsEcrScanApiRef = createApiRef<AwsEcrScanApi>({
  id: 'plugin.aws-ecr-scan.service',
});

/** @public */
export interface AwsEcrScanApi {
  listEcrImages(
    req: AwsEcrListImagesRequest,
  ): Promise<AwsEcrListImagesResponse>;
  listScanResults(
    req: AwsEcrListScanResultsRequest,
  ): Promise<AwsEcrListScanResultsResponse>;
}