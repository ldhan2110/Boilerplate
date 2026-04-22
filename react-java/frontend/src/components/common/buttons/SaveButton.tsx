import { Button, type ButtonProps } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAppTranslate } from '@/hooks';

type SaveButtonProps = ButtonProps & {
  label?: string; 
};

export const SaveButton: React.FC<SaveButtonProps> = ({
  children,
  label,
  ...props
}) => {
  const { t } = useAppTranslate();

  return (
    <Button
      type="primary"
      icon={<SaveOutlined />}
      {...props}
    >
      {children ?? label ?? t('Save')}
    </Button>
  );
};
