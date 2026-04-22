import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { observer } from 'mobx-react-lite';

import appStore from '@/stores/AppStore';
import { getAntdTheme } from '@/utils/theme';

export const AntdConfigProvider = observer(
  ({ children }: { children: ReactNode }) => {
    return (
      <ConfigProvider 
        theme={getAntdTheme(appStore.state.darkMode, appStore.state.primaryColor)} 
        locale={appStore.state.localeProvider}
      >
        {children}
      </ConfigProvider>
    );
  }
);
