import { Button, type ButtonProps } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import { useAppTranslate } from '@/hooks';

export const DeleteButton = ({ children, ...props }: ButtonProps) => {
  const { t } = useAppTranslate();
  return (
    <Button icon={<DeleteOutlined />} danger {...props}>
      {t(children as string)}
    </Button>
  );
};
