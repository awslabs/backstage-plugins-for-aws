import { Container } from "@aws-sdk/client-ecs";
import { Table, TableBody, TableCell, TableRow, Typography } from "@material-ui/core";
import React from "react";
import { TaskHealthStatus, TaskStatus } from "../EcsServices";

type EcsContainerProps = {
    container: Container,
}

export const EcsContainer = ({ container }: EcsContainerProps) => {
    console.log(container)
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Typography variant="subtitle2">Status</Typography>
                    </TableCell>
                    <TableCell>
                        <TaskStatus status={container.lastStatus} />
                    </TableCell>
                    <TableCell>
                        <Typography variant="subtitle2">Health Status</Typography>
                    </TableCell>
                    <TableCell>
                        <TaskHealthStatus status={container.healthStatus} />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Typography variant="subtitle2">CPU</Typography>
                    </TableCell>
                    <TableCell>
                        {container.cpu}
                    </TableCell>
                    <TableCell>
                        <Typography variant="subtitle2">Memory</Typography>
                    </TableCell>
                    <TableCell>
                        {container.memoryReservation}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={1}>
                        <Typography variant="subtitle2">Container Id</Typography>
                    </TableCell>
                    <TableCell colSpan={3}>
                        {container.containerArn?.split('/')[3]}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell colSpan={1}>
                        <Typography variant="subtitle2">Image Digest</Typography>
                    </TableCell>
                    <TableCell colSpan={3}>
                        {container.imageDigest}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}