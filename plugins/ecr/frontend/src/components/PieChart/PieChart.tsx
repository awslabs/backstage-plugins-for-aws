/* eslint-disable guard-for-in */
import React, { useState } from 'react';
import { Content, GaugeCard } from "@backstage/core-components"
import { Grid } from "@material-ui/core";
import { Entity, getCompoundEntityRef } from "@backstage/catalog-model";
import { useApi } from "@backstage/core-plugin-api";
import { awsEcrScanApiRef } from "../../api";

export const PieChart = (props: { entity: Entity, imageTag: string }) => {
  const api = useApi(awsEcrScanApiRef);

  const [results, setResults] = useState<any>()

  React.useEffect(() => {
    async function getRes() {
      const scanResults = await api.listScanResults({
          entityRef: getCompoundEntityRef(props.entity),
          imageTag: props.imageTag,
        });

      return scanResults

    }
    if (props.imageTag !== "") {
      getRes().then(res => setResults(res))
    }
  }, [api, props.entity, props.imageTag])

  const data: {severity: string, count: number}[] = []
  let total = 0
  for (const severity in results?.results?.findingSeverityCounts) {
    const count = results?.results.findingSeverityCounts?.[severity] as number
    const sev = severity as string
    data.push({
      severity: sev,
      count: count
    })
    total += count
  }
  return (
    <Content>
      <Grid wrap='wrap' container spacing={3} alignContent='space-between' alignItems='center' lg={12}>
        {data.map(severity => {
          return(
            <Grid alignContent='center' wrap='wrap' item md={3} sm={4} lg={3}>
              <GaugeCard
                variant="flex"
                key={severity.severity}
                progress={severity.count / total}
                title={`${severity.severity}: ${severity.count}`}
                inverse
                />
            </Grid>
          )
        })}
      </Grid>
    </Content>
  )
} 