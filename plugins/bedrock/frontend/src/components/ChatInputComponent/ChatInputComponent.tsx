import React, { useEffect, useRef, useState } from 'react';
import { Box, TextField } from '@material-ui/core';

interface ChatInputComponentProps {
  onMessage?: (message: string) => void;
  disabled?: boolean;
}

export const ChatInputComponent = ({
  onMessage,
  disabled,
}: ChatInputComponentProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!disabled) {
      const textArea = inputRef.current?.querySelector('textarea');
      textArea?.focus();
    }
  }, [disabled]);

  const checkKeyPress = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.code == 'Enter') {
      if (!evt.shiftKey) {
        onMessage && onMessage(message);
        setMessage('');
        evt.preventDefault();
      }
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <TextField
        id="outlined-multiline-flexible"
        label="Type a message"
        helperText="Hold <shift> when pressing <enter> for multiline"
        multiline
        variant="standard"
        value={message}
        style={{
          marginRight: '1rem',
        }}
        maxRows={8}
        minRows={1}
        onKeyDown={checkKeyPress}
        onChange={evt => setMessage(evt.target.value)}
        fullWidth={true}
        disabled={disabled}
        ref={inputRef}
      />
    </Box>
  );
};
