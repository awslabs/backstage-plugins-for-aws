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
  Modal,
  Typography,
  makeStyles,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { ToolRecord } from '../types';
import { MarkdownContent } from '@backstage/core-components';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    width: 800,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
}));

interface ToolParametersProps {
  tool: ToolRecord;
}

const ToolsParameters = ({ tool }: ToolParametersProps) => {
  let data: any;

  try {
    data = JSON.parse(tool.input);
  } catch (e) {
    data = tool.input;
  }

  const markdown = `
~~~json\n${JSON.stringify(data, undefined, 2)}\n~~~
`;

  return <MarkdownContent content={markdown} dialect="gfm" />;
};

interface ToolsModalProps {
  open: boolean;
  onClose: () => void;
  tools: ToolRecord[];
}

export const ToolsModal = ({ open, onClose, tools }: ToolsModalProps) => {
  const classes = useStyles();

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="tools-modal-title"
      aria-describedby="tools-modal-description"
    >
      <div className={classes.paper}>
        <h2 id="tools-modal-title">Tools</h2>
        {tools.map((tool, index) => (
          <Accordion key={index}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Typography>{tool.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ToolsParameters tool={tool} />
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </Modal>
  );
};
