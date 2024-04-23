import React from 'react';
import style from './ChatHistoryToolbar.module.css';
import Button from '@material-ui/core/Button';

export interface ChatHistoryToolbarProps {
  isLoading?: boolean;
  onClear?: () => void;
}

export const ChatHistoryToolbar = ({
  isLoading,
  onClear,
}: ChatHistoryToolbarProps) => {
  return (
    <div>
      <div></div>
      <div className={`${style.container} ${isLoading ? style.loading : ''}`}>
        <div className={style['pulse-ring']} />
      </div>
      <div className={style.clearButton}>
        <Button onClick={onClear} disabled={isLoading} variant="outlined">
          Clear Chat
        </Button>
      </div>
    </div>
  );
};
