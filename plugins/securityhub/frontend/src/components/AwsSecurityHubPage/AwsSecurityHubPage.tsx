/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Box,
  Grid,
  LinearProgress,
  Typography,
  Chip,
  Button,
} from '@material-ui/core';
import { useSecurityHubFindings } from '../../hooks/useSecurityHubFindings';
import { Entity } from '@backstage/catalog-model';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';
import { Table } from '@backstage/core-components';
import { FindingDrawer } from '../FindingDrawer';
import { getSeverityColorByName } from '../constants';
import { AssistantModal } from '../Assistant/AssistantModal';
import { useState, useMemo } from 'react';
import FilterListIcon from '@material-ui/icons/FilterList';

const generateChartData = (
  data: AwsSecurityFinding[],
  retriever: (f: AwsSecurityFinding) => string,
) => {
  const obj: Record<string, number> = {};

  const aggregate = data.reduce((previousValue, currentValue) => {
    const fieldValue = retriever(currentValue);

    if (!(fieldValue in previousValue)) {
      previousValue[fieldValue] = 1;
    } else {
      previousValue[fieldValue]++;
    }

    return previousValue;
  }, obj);

  return Object.keys(aggregate).map(key => {
    return { name: key, value: obj[key] };
  });
};

const SeverityChart = ({
  data,
  title,
  retriever,
}: {
  data: AwsSecurityFinding[];
  title: string;
  retriever: (f: AwsSecurityFinding) => string;
}) => {
  const mappedData = generateChartData(data, retriever);
  return (
    <InfoCard title={title} titleTypographyProps={{ variant: 'h6' }} noPadding>
      <ResponsiveContainer width="95%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={mappedData}
            cx="50%"
            cy="45%"
            outerRadius={75}
            innerRadius={40}
            fill="#8884d8"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {mappedData.map((entry, index) => (
              <Cell
                key={`severity-${index}`}
                fill={getSeverityColorByName(entry.name)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} findings`, 'Count']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={value => (
              <span style={{ fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </InfoCard>
  );
};

const SummaryChart = ({
  data,
  title,
  retriever,
}: {
  data: AwsSecurityFinding[];
  title: string;
  retriever: (f: AwsSecurityFinding) => string;
}) => {
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c',
  ];
  const chartData = generateChartData(data, retriever);

  return (
    <InfoCard title={title} titleTypographyProps={{ variant: 'h6' }} noPadding>
      <ResponsiveContainer width="95%" height={300}>
        <PieChart>
          <Pie
            dataKey="value"
            isAnimationActive={false}
            data={chartData}
            cx="50%"
            cy="45%"
            outerRadius={75}
            innerRadius={40}
            fill="#8884d8"
            label={({ value }) => value}
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value} findings`, 'Count']}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={value => (
              <span style={{ fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </InfoCard>
  );
};

const getSeverityOrder = (severity: string): number => {
  const order: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    INFORMATIONAL: 4,
  };
  return order[severity.toUpperCase()] ?? 999;
};

const generatedColumns = ({
  entity,
  onRowClick,
}: {
  entity: Entity;
  onRowClick: (finding: AwsSecurityFinding) => void;
}) => {
  return [
    {
      title: 'Severity',
      field: 'Severity.Label',
      customSort: (a: any, b: any) => {
        const severityA = a.Severity?.Label || '';
        const severityB = b.Severity?.Label || '';
        return getSeverityOrder(severityA) - getSeverityOrder(severityB);
      },
      defaultSort: 'asc' as const,
      render: (row: Partial<AwsSecurityFinding>) => {
        const severity = row.Severity?.Label!;
        return (
          <Chip
            label={severity}
            size="small"
            style={{
              backgroundColor: getSeverityColorByName(severity),
              color: '#fff',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      title: 'Title',
      field: 'Title',
      render: (row: AwsSecurityFinding) => (
        <Box
          style={{
            cursor: 'pointer',
            color: '#1976d2',
            textDecoration: 'none',
          }}
          onClick={e => {
            e.stopPropagation();
            onRowClick(row);
          }}
        >
          {row.Title}
        </Box>
      ),
    },
    {
      title: 'Resource Type',
      field: 'Resources',
      render: (row: AwsSecurityFinding) => {
        const resourceTypes = row.Resources?.map(r => r.Type).filter(Boolean);
        const uniqueTypes = Array.from(new Set(resourceTypes));
        return uniqueTypes.length > 0 ? uniqueTypes.join(', ') : '-';
      },
    },
    {
      title: 'Region',
      field: 'Region',
    },
    {
      title: 'Account ID',
      field: 'AwsAccountId',
    },
    {
      title: 'Resolution',
      field: 'Resolution',
      render: (row: AwsSecurityFinding) => {
        return <AssistantModal entity={entity} finding={row} />;
      },
    },
  ];
};

const AWSSecurityHubContent = ({
  response,
  entity,
}: {
  response: AwsSecurityFinding[];
  entity: Entity;
}) => {
  const [selectedFinding, setSelectedFinding] =
    useState<AwsSecurityFinding | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [accountFilter, setAccountFilter] = useState<string[]>([]);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string[]>([]);

  // Get unique values for filters
  const uniqueSeverities = useMemo(
    () =>
      Array.from(
        new Set(response.map(f => f.Severity?.Label).filter(Boolean)),
      ) as string[],
    [response],
  );
  const uniqueAccounts = useMemo(
    () =>
      Array.from(
        new Set(response.map(f => f.AwsAccountId).filter(Boolean)),
      ) as string[],
    [response],
  );
  const uniqueResourceTypes = useMemo(() => {
    const allTypes = response.flatMap(
      f => f.Resources?.map(r => r.Type).filter(Boolean) || [],
    );
    return Array.from(new Set(allTypes)) as string[];
  }, [response]);

  // Filter data
  const filteredData = useMemo(() => {
    return response.filter(finding => {
      const severityMatch =
        severityFilter.length === 0 ||
        severityFilter.includes(finding.Severity?.Label || '');
      const accountMatch =
        accountFilter.length === 0 ||
        accountFilter.includes(finding.AwsAccountId || '');
      const resourceTypeMatch =
        resourceTypeFilter.length === 0 ||
        finding.Resources?.some(
          r => r.Type && resourceTypeFilter.includes(r.Type),
        );

      return severityMatch && accountMatch && resourceTypeMatch;
    });
  }, [response, severityFilter, accountFilter, resourceTypeFilter]);

  const handleFilterToggle = (
    filterArray: string[],
    setFilter: (value: string[]) => void,
    value: string,
  ) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(v => v !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const handleRowClick = (finding: AwsSecurityFinding) => {
    setSelectedFinding(finding);
  };

  const clearAllFilters = () => {
    setSeverityFilter([]);
    setAccountFilter([]);
    setResourceTypeFilter([]);
  };

  const hasActiveFilters =
    severityFilter.length > 0 ||
    accountFilter.length > 0 ||
    resourceTypeFilter.length > 0;

  const columns = generatedColumns({
    entity,
    onRowClick: handleRowClick,
  });

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item md={4}>
          <SeverityChart
            data={filteredData}
            title="Severity"
            retriever={e => e.Severity!.Label!}
          />
        </Grid>
        <Grid item md={4}>
          <SummaryChart
            data={filteredData}
            title="AWS Account"
            retriever={e => e.AwsAccountId!}
          />
        </Grid>
        <Grid item md={4}>
          <SummaryChart
            data={filteredData}
            title="AWS Region"
            retriever={e => e.Region!}
          />
        </Grid>
        <Grid item md={12}>
          <InfoCard
            title={
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center">
                  <FilterListIcon style={{ marginRight: 8 }} />
                  <Typography variant="h6">Filters</Typography>
                </Box>
                {hasActiveFilters && (
                  <Button
                    size="small"
                    onClick={clearAllFilters}
                    variant="outlined"
                  >
                    Clear All
                  </Button>
                )}
              </Box>
            }
          >
            <Box>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Severity
                </Typography>
                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                  {uniqueSeverities.map(severity => (
                    <Chip
                      key={severity}
                      label={severity}
                      onClick={() =>
                        handleFilterToggle(
                          severityFilter,
                          setSeverityFilter,
                          severity,
                        )
                      }
                      style={
                        severityFilter.includes(severity)
                          ? {
                              backgroundColor: getSeverityColorByName(severity),
                              color: '#fff',
                              fontWeight: 600,
                            }
                          : {
                              border: `2px solid ${getSeverityColorByName(
                                severity,
                              )}`,
                              color: getSeverityColorByName(severity),
                              fontWeight: 600,
                            }
                      }
                      variant={
                        severityFilter.includes(severity)
                          ? 'default'
                          : 'outlined'
                      }
                    />
                  ))}
                </Box>
              </Box>
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  AWS Account
                </Typography>
                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                  {uniqueAccounts.map(account => (
                    <Chip
                      key={account}
                      label={account}
                      onClick={() =>
                        handleFilterToggle(
                          accountFilter,
                          setAccountFilter,
                          account,
                        )
                      }
                      color={
                        accountFilter.includes(account) ? 'primary' : 'default'
                      }
                      variant={
                        accountFilter.includes(account) ? 'default' : 'outlined'
                      }
                    />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Resource Type
                </Typography>
                <Box display="flex" flexWrap="wrap" style={{ gap: 8 }}>
                  {uniqueResourceTypes.map(resourceType => (
                    <Chip
                      key={resourceType}
                      label={resourceType}
                      onClick={() =>
                        handleFilterToggle(
                          resourceTypeFilter,
                          setResourceTypeFilter,
                          resourceType,
                        )
                      }
                      color={
                        resourceTypeFilter.includes(resourceType)
                          ? 'primary'
                          : 'default'
                      }
                      variant={
                        resourceTypeFilter.includes(resourceType)
                          ? 'default'
                          : 'outlined'
                      }
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </InfoCard>
        </Grid>
        <Grid item md={12}>
          <Table
            data={filteredData ?? []}
            title={
              <Box display="flex" alignItems="center">
                <Typography variant="h6">
                  Findings{' '}
                  {filteredData.length !== response.length &&
                    `(${filteredData.length} of ${response.length})`}
                </Typography>
              </Box>
            }
            columns={columns}
            options={{
              padding: 'default',
              pageSize: 10,
              pageSizeOptions: [5, 10, 20, 50],
              sorting: true,
            }}
          />
        </Grid>
      </Grid>
      {selectedFinding && (
        <FindingDrawer
          finding={selectedFinding}
          open
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
};

type AwsSecurityHubPageProps = {
  entity: Entity;
};

export const AwsSecurityHubPage = ({ entity }: AwsSecurityHubPageProps) => {
  const { response, loading, error } = useSecurityHubFindings({ entity });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ m: 2 }}>
      <Typography variant="h4" style={{ marginBottom: '20px' }}>
        AWS Security Hub
      </Typography>
      <AWSSecurityHubContent entity={entity} response={response!} />
    </Box>
  );
};
