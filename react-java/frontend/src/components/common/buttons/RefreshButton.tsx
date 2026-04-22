import { Button, type ButtonProps } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const RefreshButton = (props: ButtonProps) => {
  const { t } = useAppTranslate();
  return (
    <Button icon={<ReloadOutlined />} {...props}>
      {t("Refresh")}
    </Button>
  );
};
