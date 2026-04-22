import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const getAntdTheme = (darkMode: boolean, primaryColor?: string): ThemeConfig => {
  return {
    algorithm: darkMode ? darkAlgorithm : defaultAlgorithm,
    cssVar: true,
    token: {
      colorPrimary: primaryColor || '#1890ff',
    },
    components: {},
  };
};