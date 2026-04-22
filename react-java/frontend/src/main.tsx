import './i18n'; // Ensure i18n is initialized
import './global.css';
import { queryClient } from './configs';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './pages/App';
import { App as AntApp } from 'antd';
import AuthGuard from './pages/AuthGuard';
import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AntdConfigProvider, PermissionProvider } from '@components/common';

createRoot(document.getElementById('root')!).render(
	<Suspense>
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<AntdConfigProvider>
					<BrowserRouter>
						<Routes>
							{/* Authenticated routes -- INSIDE AuthGuard */}
							<Route
								path="/*"
								element={
									<AuthGuard>
										<PermissionProvider>
											<AntApp>
												<Routes>
													<Route path="/" element={<App />} />
													<Route path="/:tabKeys" element={<App />} />
													<Route path="*" element={<Navigate to="/" replace />} />
												</Routes>
											</AntApp>
										</PermissionProvider>
									</AuthGuard>
								}
							/>
						</Routes>
					</BrowserRouter>
				</AntdConfigProvider>
			</QueryClientProvider>
		</StrictMode>
	</Suspense>,
);
