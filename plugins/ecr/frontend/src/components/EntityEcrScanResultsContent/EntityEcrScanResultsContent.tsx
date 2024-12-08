import React, { useEffect, useState } from 'react';
import { Grid, FormControl, InputLabel, MenuItem, Select, Divider } from '@material-ui/core';
import {
  Page,
  Content,
  ContentHeader,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useImages } from '../../hooks/useImages';
import { PieChart } from '../PieChart'; 
import { ResultsTable } from '../ResultsTable';
import { ImageDetail } from '@aws-sdk/client-ecr';
import { useSearchParams } from 'react-router-dom';


export const EntityEcrScanResultsContent = () => {
  const { entity } = useEntity();

  const [searchParams, setSearchParams] = useSearchParams();

  const [imageTag, setImageTag] = useState("")

  const handleChange = (event: any) => {
    setSearchParams({
      imageTag: event.target.value,
    })
  }

  const { images } = useImages(entity)

  useEffect(() => {
    setImageTag(searchParams.get("imageTag") as string)
  }, [searchParams])
  
  

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="AWS ECR Scan Results" >
          <Grid item md={6}>
            <FormControl>
              <InputLabel>Images</InputLabel>
                <Select
                  value={imageTag}
                  label="Images"
                  onChange={handleChange}
                >
                {images?.items?.map((image: ImageDetail) => {
                  return (
                    <MenuItem key={image.imageDigest} value={image.imageTags?.[0]}>{image.imageTags?.[0]} - {image.imagePushedAt}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Grid>
        </ContentHeader>
        <PieChart imageTag={imageTag} entity={entity} />
        <Divider />
        <ResultsTable imageTag={imageTag} entity={entity} />
      </Content>
    </Page>
  )
}
