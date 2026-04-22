import { Button, type ButtonProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const AddButton = ({ children, ...props }: ButtonProps) => {
  const { t } = useAppTranslate();
  return (
    <Button type="primary" icon={<PlusOutlined />} {...props}>
      {t(children as string)}
    </Button>
  );
};
