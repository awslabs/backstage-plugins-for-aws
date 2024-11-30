import {
  Table,
  TableColumn,
} from "@backstage/core-components";
import * as React from 'react';
import { ImageScanFinding } from "@aws-sdk/client-ecr"
import { Entity } from "@backstage/catalog-model";
import { useApi } from "@backstage/core-plugin-api";
import { awsEcrScanApiRef } from "../../api";
import { Typography } from "@material-ui/core";
import { ECR_ANNOTATION } from "../../plugin";



export const ResultsTable = (props: {imageTag: string, entity: Entity}) => {
  const [results, setResults] = React.useState<any>()
  const [columns, setColumns] = React.useState<TableColumn[]>([
    {
      title: 'Name',
      field: 'name',
      width: '25%',
    },
    { title: 'Severity', 
      field: 'severity', 
      width: '20%', 
      defaultSort: 'desc', 
    },
    { title: 'Description', 
      field: 'description', 
      width: '30%' 
    },
  ]);
  const api = useApi(awsEcrScanApiRef);

  React.useEffect(() => {
    async function getRes() {
      const componentKey = props.entity.metadata?.annotations?.[ECR_ANNOTATION] as string;

      const scanResults = await api.listScanResults({
        componentKey: componentKey,
        imageTag: props.imageTag,
      });

      return scanResults

    }
    if (props.imageTag !== "") {
      getRes().then(res => {
        if (!!res?.results?.enhancedFindings?.length) {
          const newColumns = [...columns];
          newColumns[0].field = "title";
          setColumns(newColumns);
        }
        setResults(res)
      })
    }
  }, [api, props.entity.metadata?.annotations, props.imageTag])

  return !!results?.results ? (
    <>
      {!results?.results?.enhancedFindings?.length &&
      <Typography>No Findings Yet</Typography>
      }
      {!!results?.results?.enhancedFindings?.length &&
        <Table
          title="Findings"
          options={{
            search: false,
            paging: true,
            sorting: true,
            pageSize: 10,
            pageSizeOptions: [10, 25, 50, 100, 250],
            actionsColumnIndex: -1,
          }}
          columns={columns}
          data={results?.results?.enhancedFindings as ImageScanFinding[]}
          localization={{
            header: {
                actions: '',
              },
            }}
          />
        }
    </>
  ) : <></>
} 