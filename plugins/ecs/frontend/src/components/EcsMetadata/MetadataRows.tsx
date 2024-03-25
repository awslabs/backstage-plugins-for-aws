import TableCell from "@material-ui/core/TableCell"
import TableRow from "@material-ui/core/TableRow"
import words from 'lodash/startCase';
import React from "react"

type MetadataRowsProps = {
    metadata: { [key: string]: string }
}

export const MetadataRows = ({ metadata }: MetadataRowsProps) => (
    <>
        {Object.keys(metadata).map((propName) => (
            <TableRow key={propName}>
                <TableCell>
                    {words(propName).replace(/I\s+Pv\s+/, 'IPv')}
                </TableCell>
                <TableCell>
                    {metadata[propName]}
                </TableCell>
            </TableRow>
        ))}
    </>
)