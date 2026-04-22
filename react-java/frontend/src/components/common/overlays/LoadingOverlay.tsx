import { Spin } from 'antd';

import { useAppTranslate } from '@/hooks';

export const LoadingOverlay = () => {
  const { t } = useAppTranslate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spin size="large" />
        <div className="mt-4">{t("Loading")}</div>
      </div>
    </div>
  );
};
