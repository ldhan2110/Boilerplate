import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { observer } from 'mobx-react-lite';

import LoginPage from './LoginPage';
import { authService } from '@/services/auth/authJwtService';
import { authStore } from '@/stores';
import { useAppTranslate } from '@/hooks';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = observer(({ children }) => {
  const { t } = useAppTranslate();

  useEffect(() => {
    // Setup axios interceptors khi component mount
    authService.setupAxiosInterceptors();
  }, []);

  if (authStore.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">{t("Loading Credentials")}</div>
        </div>
      </div>
    );
  }

  if (!authStore.isAuthenticated) {
    return <LoginPage redirectUrl={window.location.pathname + window.location.search} />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung chính
  return <>{children}</>;
});

export default AuthGuard;
