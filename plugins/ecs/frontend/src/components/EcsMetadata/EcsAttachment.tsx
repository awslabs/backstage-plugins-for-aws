import { Attachment, KeyValuePair } from "@aws-sdk/client-ecs";
import { TableBody, TableCell, TableRow } from "@material-ui/core";
import Table from "@material-ui/core/Table";
import React, { useEffect, useState } from "react";
import { MetadataRows } from "./MetadataRows";

const mapDetails = (details: KeyValuePair[] = []): { [key: string]: string } => details.reduce(
    (objDetails, kv) => ({ [kv.name as string]: kv.value, ...objDetails }), {} as any);

type EcsAttachmentProps = {
    attachment: Attachment,
}

export const EcsAttachment = ({ attachment }: EcsAttachmentProps) => {
    const [details, setDetails] = useState(mapDetails(attachment.details));
    useEffect(() => {
        setDetails(mapDetails(attachment.details))
    }, [attachment]);

    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell>
                        Id
                    </TableCell>
                    <TableCell>
                        {attachment.id}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        Status
                    </TableCell>
                    <TableCell>
                        {attachment.status}
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        Type
                    </TableCell>
                    <TableCell>
                        {attachment.type}
                    </TableCell>
                </TableRow>
                <MetadataRows metadata={details} />
            </TableBody>
        </Table>
    )

}