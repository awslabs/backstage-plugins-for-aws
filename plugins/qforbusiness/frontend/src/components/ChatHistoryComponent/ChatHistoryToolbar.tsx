import React, { useEffect, useState } from 'react';
import BedrockLogo from './bedrock-logo.png';
import style from './ChatHistoryToolbar.module.css';
import Button from '@material-ui/core/Button';

export interface ChatHistoryToolbarProps {
  isStreaming?: boolean;
  onClear?: () => void;
}

export const ChatHistoryToolbar = ({
  isStreaming,
  onClear,
}: ChatHistoryToolbarProps) => {
  const [disabled, setDisabled] = useState(isStreaming);

  useEffect(() => {
    setDisabled(isStreaming);
  }, [isStreaming]);

  return (
    <div>
      <div></div>
      <div
        className={`${style.container} ${isStreaming ? style.streaming : ''}`}
      >
        <img className={style.pulse} src={BedrockLogo} />
        <div className={style['pulse-ring']} />
      </div>
      <div className={style.clearButton}>
        <Button onClick={onClear} disabled={disabled} variant="outlined">
          Clear Chat
        </Button>
      </div>
    </div>
  );
};
