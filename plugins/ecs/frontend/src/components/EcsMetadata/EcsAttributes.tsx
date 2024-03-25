import { Attribute, KeyValuePair } from "@aws-sdk/client-ecs";
import { TableBody } from "@material-ui/core";
import Table from "@material-ui/core/Table";
import React, { useEffect, useState } from "react";
import { MetadataRows } from "./MetadataRows";

const mapDetails = (details: KeyValuePair[] = []): { [key: string]: string } => details.reduce(
    (objDetails, kv) => ({ [kv.name as string]: kv.value, ...objDetails }), {} as any);

type EcsAttributesProps = {
    attributes?: Attribute[],
}

export const EcsAttributes = ({ attributes }: EcsAttributesProps) => {
    const [details, setDetails] = useState(mapDetails(attributes));
    useEffect(() => {
        setDetails(mapDetails(attributes))
    }, [attributes]);

    return (
        <Table size="small">
            <TableBody>
                <MetadataRows metadata={details} />
            </TableBody>
        </Table>
    )
}