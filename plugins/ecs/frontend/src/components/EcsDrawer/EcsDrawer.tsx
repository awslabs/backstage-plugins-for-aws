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

import React, { ChangeEvent, useState } from 'react';

import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles,
} from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';

const useDrawerContentStyles = makeStyles((_theme: Theme) =>
  createStyles({
    header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    icon: {
      fontSize: 20,
    },
  }),
);

interface EcsDrawerContentProps {
  close: () => void;
  title: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}

const EcsDrawerContent = ({
  children,
  header,
  title,
  close,
}: EcsDrawerContentProps) => {
  const classes = useDrawerContentStyles();

  return (
    <>
      <div className={classes.header}>
        <Grid container justifyContent="flex-start" alignItems="flex-start">
          <Grid item xs={11}>
            <Typography variant="h5">{title}</Typography>
          </Grid>
          <Grid item xs={1}>
            <IconButton
              key="dismiss"
              title="Close the drawer"
              onClick={() => close()}
              color="inherit"
            >
              <CloseIcon className={classes.icon} />
            </IconButton>
          </Grid>
          <Grid item xs={12}>
            {header}
          </Grid>
        </Grid>
      </div>
      <div>{children}</div>
    </>
  );
};

export interface EcsDrawerProps {
  open?: boolean;
  title: string;
  label: React.ReactNode;
  drawerContentsHeader?: React.ReactNode;
  children?: React.ReactNode;
}

const useDrawerStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: '50%',
      justifyContent: 'space-between',
      padding: theme.spacing(2.5),
    },
  }),
);

const DrawerButton = withStyles({
  root: {
    padding: '6px 5px',
  },
  label: {
    textTransform: 'none',
  },
})(Button);

export const EcsDrawer = ({
  open,
  label,
  drawerContentsHeader,
  title,
  children,
}: EcsDrawerProps) => {
  const classes = useDrawerStyles();
  const [isOpen, setIsOpen] = useState<boolean>(open ?? false);

  const toggleDrawer = (e: ChangeEvent<{}>, newValue: boolean) => {
    e.stopPropagation();
    setIsOpen(newValue);
  };

  return (
    <>
      <DrawerButton
        onClick={event => {
          setIsOpen(true);
          event.stopPropagation();
        }}
        style={{ width: '100%', textAlign: 'left', justifyContent: 'left' }}
      >
        {label}
      </DrawerButton>
      <Drawer
        classes={{
          paper: classes.paper,
        }}
        anchor="right"
        open={isOpen}
        onClose={(e: any) => toggleDrawer(e, false)}
        onClick={event => event.stopPropagation()}
      >
        {isOpen && (
          <EcsDrawerContent
            header={drawerContentsHeader}
            title={title}
            children={children}
            close={() => setIsOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
};
