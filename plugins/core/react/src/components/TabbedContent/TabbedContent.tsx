/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { makeStyles } from '@material-ui/core';
import React, {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useState,
} from 'react';
import { TabProps } from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

type TabbedContentProps = {
  children?: ReactElement<TabProps>[];
};

const useTabsStyles = makeStyles(
  theme => ({
    root: {
      padding: theme.spacing(1, 2, 0, 2.5),
      minHeight: theme.spacing(3),
    },
    indicator: {
      backgroundColor: theme.palette.info.main,
      height: theme.spacing(0.3),
    },
  }),
  { name: 'TabbedContent' },
);

export function TabbedContent(props: PropsWithChildren<TabbedContentProps>) {
  const { children } = props;
  const tabsClasses = useTabsStyles();
  const [selectedIndex, selectIndex] = useState(0);

  const handleChange = (_ev: unknown, newSelectedIndex: number) =>
    selectIndex(newSelectedIndex);

  let selectedTabContent: ReactNode;
  React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && index === selectedIndex) {
      selectedTabContent = child?.props.children;
    }
  });

  return (
    <div>
      <Tabs classes={tabsClasses} value={selectedIndex} onChange={handleChange}>
        {children}
      </Tabs>
      <div>{selectedTabContent}</div>
    </div>
  );
}
