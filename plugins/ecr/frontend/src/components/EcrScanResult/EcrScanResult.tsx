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

import { ResponseErrorPanel } from '@backstage/core-components';
import { Link, useParams } from 'react-router-dom';
import { Entity } from '@backstage/catalog-model';
import { useImageScanFindings } from '../../hooks/useImageScanResults';
import { LinearProgress, makeStyles } from '@material-ui/core';
import KeyboardBackspaceIcon from '@material-ui/icons/KeyboardBackspace';
import { rootRouteRef } from '../../routes';
import { useRouteRef } from '@backstage/core-plugin-api';
import { ScanFindingsTable } from '../ScanFindingsTable';
import { EnhancedScanFindingsTable } from '../EnhancedScanFindingsTable';

const useStyles = makeStyles({
  link: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  linkText: {
    marginLeft: '0.5rem',
    fontSize: '1.1rem',
  },
});

export const EcrScanResult = ({ entity }: { entity: Entity }) => {
  const { repository, digest } = useParams();

  if (!repository || !digest) {
    throw new Error('No repository or digest provided');
  }

  const rootLink = useRouteRef(rootRouteRef);

  const { response, loading, error } = useImageScanFindings({
    entity,
    repository,
    digest,
  });

  const classes = useStyles();

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <div>
      <div>
        <Link to={rootLink()} className={classes.link}>
          <KeyboardBackspaceIcon />
          <span className={classes.linkText}>Back to repositories</span>
        </Link>
      </div>
      <div>
        {response?.findings.findings && (
          <ScanFindingsTable
            digest={digest}
            findings={response.findings.findings}
          />
        )}
        {response?.findings.enhancedFindings && (
          <EnhancedScanFindingsTable
            digest={digest}
            findings={response.findings.enhancedFindings}
          />
        )}
      </div>
    </div>
  );
};
