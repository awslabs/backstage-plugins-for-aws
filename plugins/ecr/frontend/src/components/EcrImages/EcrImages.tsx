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

import { useState } from 'react';
import { LinearProgress, Select } from '@material-ui/core';
import { Box, Link as LinkCore } from '@material-ui/core';
import { Table, ResponseErrorPanel, Link } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { MissingResources } from '@aws/aws-core-plugin-for-backstage-react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { parse } from '@aws-sdk/util-arn-parser';
import { useImages } from '../../hooks/useImages';
import {
  EcrImagesResponse,
  ImageRepository,
} from '@aws/amazon-ecr-plugin-for-backstage-common';
import { ImageDetail } from '@aws-sdk/client-ecr';
import { formatTime } from '../../util';
import prettyBytes from 'pretty-bytes';
import { generateShortcutLink } from '@aws/aws-core-plugin-for-backstage-common';

const generatedColumns = (
  repositoryArn: string,
  repositoryName: string,
  region: string,
  accountId: string,
  ssoSubdomain?: string,
) => {
  return [
    {
      title: 'Tag',
      field: 'imageTags',

      render: (row: Partial<ImageDetail>) => {
        const projectUrl = `https://${region}.console.aws.amazon.com/ecr/repositories/private/${accountId}/${repositoryName}/_/image/${row.imageDigest}/details?region=${region}`;

        const tagString = row.imageTags?.join(', ') || '-';

        return (
          <>
            <LinkCore
              href={
                ssoSubdomain
                  ? generateShortcutLink(ssoSubdomain, accountId, projectUrl)
                  : projectUrl
              }
              target="_blank"
            >
              {tagString}
            </LinkCore>
          </>
        );
      },
    },
    {
      title: 'Pushed at',
      field: 'imagePushedAt',
      render: (row: Partial<ImageDetail>) =>
        `${formatTime(row.imagePushedAt)} ago`,
    },
    {
      title: 'Size',
      field: 'imageSizeInBytes',
      render: (row: Partial<ImageDetail>) => prettyBytes(row.imageSizeInBytes!),
    },
    {
      title: 'Scan',
      field: 'scan',
      render: (row: Partial<ImageDetail>) => {
        return (
          <Link
            to={`repository/${encodeURIComponent(repositoryArn)}/tag/${
              row.imageDigest
            }`}
          >
            Findings
          </Link>
        );
      },
    },
    {
      title: 'Digest',
      field: 'imageDigest',
      render: (row: Partial<ImageDetail>) => row.imageDigest,
    },
  ];
};

type EcrImagesTableProps = {
  response: ImageRepository;
};

const EcrImagesTable = ({ response }: EcrImagesTableProps) => {
  const configApi = useApi(configApiRef);
  const ssoSubdomain = configApi.getOptionalString('aws.sso.subdomain');
  const { accountId } = parse(response.repositoryArn);

  return (
    <Table
      data={response.images}
      columns={generatedColumns(
        response.repositoryArn,
        response.repositoryName,
        response.repositoryRegion,
        accountId,
        ssoSubdomain,
      )}
      title="Amazon ECR"
    />
  );
};

type EcrImagesContentProps = {
  response: EcrImagesResponse;
};

const EcrMultipleRepositoriesContent = ({
  response,
}: EcrImagesContentProps) => {
  const [selected, setSelected] = useState<ImageRepository>(
    response.repositories[0],
  );

  return (
    <>
      <Box marginBottom={2}>
        <Select
          data-testid="select-repository"
          value={selected.repositoryArn}
          onChange={e =>
            setSelected(
              response.repositories.find(
                p => p.repositoryArn === e.target.value,
              )!,
            )
          }
        >
          {response.repositories.map(repository => (
            <option
              key={repository.repositoryArn}
              value={repository.repositoryArn}
            >
              {repository.repositoryName}
            </option>
          ))}
        </Select>
      </Box>
      <EcrImagesTable response={selected} />
    </>
  );
};

const EcrImagesContent = ({ response }: EcrImagesContentProps) => {
  if (response?.repositories.length === 0) {
    return (
      <>
        <MissingResources />
      </>
    );
  }

  if (response.repositories.length === 1) {
    return (
      <>
        <EcrImagesTable response={response.repositories[0]} />
      </>
    );
  }

  return <EcrMultipleRepositoriesContent response={response} />;
};

type EcrImagesProps = {
  entity: Entity;
};

export const EcrImages = ({ entity }: EcrImagesProps) => {
  const { response, loading, error } = useImages({ entity });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return <EcrImagesContent response={response!} />;
};
