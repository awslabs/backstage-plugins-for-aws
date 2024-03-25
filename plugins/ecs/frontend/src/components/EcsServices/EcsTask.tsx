import { Task } from "@aws-sdk/client-ecs";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { getTaskDefinition, getTaskId } from "../../shared/utils";
import IconButton from "@material-ui/core/IconButton";
import Close from '@material-ui/icons/Close';
import { InfoCard, StructuredMetadataTable } from '@backstage/core-components';
import Card from "@material-ui/core/Card";
import { EcsAttachment } from "../EcsMetadata/EcsAttachment";
import { EcsAttributes } from "../EcsMetadata/EcsAttributes";
import { EcsContainer } from "../EcsMetadata/EcsContainer";

const taskFormatDetails: { [key: string]: (task: Task) => any } = {
    'attachments': (task: Task) => (<Card>{task.attachments?.map((attachment) => <EcsAttachment attachment={attachment} />)}</Card>),
    'attributes': (task: Task) => (<Card><EcsAttributes attributes={task.attributes} /></Card>),
    'containers': (task: Task) => (<>{task.containers?.map((container) => <InfoCard variant="gridItem" title={container.name} subheader={container.image}><EcsContainer container={container} /></InfoCard>)}</>),
};

const formatTask = (task: Task) => Object.keys(task).reduce((task, property) => ({
    ...task,
    [property as keyof typeof taskFormatDetails]: taskFormatDetails[property] ? taskFormatDetails[property](task) : task[property as keyof Task]
}), task);

export const EcsTaskDetails = ({ task, toggleDrawer }: { task: Task, toggleDrawer: (open: boolean) => void }) => {

    return (
        <Grid
            container
            direction="column"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
            style={{ position: 'relative' }}
        >
            <Grid item container direction="column" alignItems="flex-end">
                <Grid item container alignItems="center" justifyContent="space-between" spacing={2}>
                    <Grid item xs={11}><Typography variant="h6">Task {getTaskId(task.taskArn)}</Typography></Grid>
                    <Grid item xs={1} style={{ textAlign: 'end' }}><IconButton
                        key="dismiss"
                        title="Close the drawer"
                        onClick={() => toggleDrawer(false)}
                        color="inherit"
                        size="small"
                    >
                        <Close />
                    </IconButton></Grid>
                </Grid>
                <Grid item container>
                    <Grid item xs={12}>
                        <Typography color="textSecondary" variant="subtitle1">
                            {getTaskDefinition(task.taskDefinitionArn)}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid
                item
                xs={12}
                spacing={0}
                container
                direction="column"
                justifyContent="flex-start"
                alignItems="flex-start"
            >
                <StructuredMetadataTable metadata={formatTask(task)} />
            </Grid>
        </Grid >
    );
};