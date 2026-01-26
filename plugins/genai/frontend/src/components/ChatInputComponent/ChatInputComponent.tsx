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

import React, { useEffect, useRef, useState } from 'react';
import { Button, makeStyles, TextField } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = makeStyles({
  ChatInputLayout: {
    display: 'flex',
    flexDirection: 'row',
  },

  ChatInputContainer: {
    flex: 1,
  },

  ChatInputButtons: {
    marginLeft: '0.5rem',
    display: 'flex',
    alignItems: 'center',
  },

  ChatInputButton: {
    marginLeft: '0.5rem',
    minWidth: '36px',
    padding: '10px',
  },
});

interface ChatInputComponentProps {
  onMessage: (message: string) => void;
  disabled?: boolean;
  onClear?: () => void;
  onCancel?: () => void;
}

export const ChatInputComponent = ({
  onMessage,
  disabled,
  onClear,
  onCancel,
}: ChatInputComponentProps) => {
  const classes = useStyles();

  const inputRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!disabled) {
      const textArea = inputRef.current?.querySelector('textarea');
      textArea?.focus();
    }
  }, [disabled]);

  const processMessage = () => {
    onMessage(message);
    setMessage('');
  };

  const checkKeyPress = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.code === 'Enter') {
      if (!evt.shiftKey && message.trim()) {
        processMessage();
        evt.preventDefault();
      }
    }
  };

  return (
    <div>
      <div className={classes.ChatInputLayout}>
        <div className={classes.ChatInputContainer}>
          <TextField
            id="outlined-multiline-flexible"
            label="Type a message"
            multiline
            variant="outlined"
            value={message}
            style={{
              marginRight: '1rem',
            }}
            maxRows={8}
            minRows={1}
            onKeyDown={checkKeyPress}
            onChange={evt => setMessage(evt.target.value)}
            fullWidth
            disabled={disabled}
            ref={inputRef}
          />
        </div>
        <div className={classes.ChatInputButtons}>
          <Button
            title="Send"
            onClick={processMessage}
            disabled={!message.trim()}
            variant="contained"
            color="primary"
            className={classes.ChatInputButton}
          >
            <SendIcon />
          </Button>
          <Button
            title="Clear"
            onClick={onClear}
            disabled={disabled}
            variant="text"
            className={classes.ChatInputButton}
          >
            <DeleteIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};
