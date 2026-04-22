import React from 'react';
import { Alert, Button, ConfigProvider, Flex, Form, Grid, Input, Typography, theme } from 'antd';

import type { LoginRequest } from '@/types';
import { useAppTranslate } from '@/hooks';
import { authStore } from '@/stores';
import { observer } from 'mobx-react-lite';
import appStore from '@/stores/AppStore';

interface LoginPageProps {
	redirectUrl?: string;
}

const LoginPage: React.FC<LoginPageProps> = observer(({ redirectUrl }) => {
	const [form] = Form.useForm();
	const { t } = useAppTranslate();
	const breakpoint = Grid.useBreakpoint();
	const isPhone = !breakpoint.sm;
	const { token } = theme.useToken();
	const { darkMode } = appStore.state

	const onFinish = async (values: LoginRequest) => {
		const success = await authStore.login({
			...values,
			username: `${values.companyCode}::${values.username}`,
		});

		if (success && redirectUrl && redirectUrl.startsWith('/app/')) {
			window.location.href = redirectUrl;
		}
	};

	return (
		<div
			style={{
				minHeight: '100vh',
				display: isPhone ? 'block' : 'flex',
				width: '100%',
			}}
		>
			{/* Left Section - Blue Background with Images */}
			{!isPhone && <div
				style={{
					width: '65%',
					background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 100%)`,
					position: 'relative',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					padding: '60px 40px',
					overflow: 'hidden',
				}}
			>
				{/* Animated gradient overlay */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
						pointerEvents: 'none',
					}}
				/>

				{/* Overlay decorative shapes */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						opacity: 0.2,
						pointerEvents: 'none',
					}}
				>
					{/* Top left cluster */}
					<div
						style={{
							position: 'absolute',
							top: '5%',
							left: '3%',
							width: '160px',
							height: '160px',
							background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
							borderRadius: '30px',
							transform: 'rotate(15deg)',
							boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '10%',
							left: '15%',
							width: '100px',
							height: '100px',
							background: 'rgba(255, 255, 255, 0.15)',
							borderRadius: '20px',
							transform: 'rotate(-20deg)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '3%',
							left: '20%',
							width: '60px',
							height: '60px',
							background: 'rgba(255, 255, 255, 0.1)',
							borderRadius: '12px',
							transform: 'rotate(8deg)',
						}}
					/>

					{/* Top right cluster */}
					<div
						style={{
							position: 'absolute',
							top: '8%',
							right: '5%',
							width: '120px',
							height: '120px',
							background: 'rgba(255, 255, 255, 0.12)',
							borderRadius: '24px',
							transform: 'rotate(28deg)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '15%',
							right: '2%',
							width: '80px',
							height: '80px',
							background: 'rgba(255, 255, 255, 0.08)',
							borderRadius: '16px',
							transform: 'rotate(-25deg)',
						}}
					/>

					{/* Middle decorative circles */}
					<div
						style={{
							position: 'absolute',
							top: '45%',
							left: '5%',
							width: '50px',
							height: '50px',
							background: 'rgba(255, 255, 255, 0.1)',
							borderRadius: '50%',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							top: '50%',
							right: '8%',
							width: '70px',
							height: '70px',
							background: 'rgba(255, 255, 255, 0.08)',
							borderRadius: '50%',
						}}
					/>

					{/* Bottom left cluster */}
					<div
						style={{
							position: 'absolute',
							bottom: '15%',
							left: '6%',
							width: '140px',
							height: '140px',
							background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06))',
							borderRadius: '28px',
							transform: 'rotate(32deg)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							bottom: '8%',
							left: '18%',
							width: '90px',
							height: '90px',
							background: 'rgba(255, 255, 255, 0.12)',
							borderRadius: '18px',
							transform: 'rotate(-18deg)',
						}}
					/>

					{/* Bottom right cluster */}
					<div
						style={{
							position: 'absolute',
							bottom: '10%',
							right: '10%',
							width: '110px',
							height: '110px',
							background: 'rgba(255, 255, 255, 0.14)',
							borderRadius: '22px',
							transform: 'rotate(-22deg)',
						}}
					/>
					<div
						style={{
							position: 'absolute',
							bottom: '22%',
							right: '4%',
							width: '85px',
							height: '85px',
							background: 'rgba(255, 255, 255, 0.09)',
							borderRadius: '17px',
							transform: 'rotate(20deg)',
						}}
					/>
				</div>

				{/* Image frames - Scattered photo collage style */}
				<div
					style={{
						position: 'relative',
						width: '100%',
						maxWidth: '700px',
						marginBottom: '60px',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1,
						minHeight: '400px',
					}}
				>
					{/* Left side - Top image frame (Meeting Room) */}
					<div
						style={{
							position: 'absolute',
							top: '20px',
							left: '30px',
							width: '240px',
							height: '180px',
							backgroundColor: 'white',
							borderRadius: '16px',
							transform: 'rotate(-6deg)',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							padding: '8px',
						}}
					>
						<img
							src="/images/meeting_room.png"
							alt={t('Meeting Room')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '6px',
							}}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = 'none';
								target.parentElement!.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
								target.parentElement!.style.display = 'flex';
								target.parentElement!.style.alignItems = 'center';
								target.parentElement!.style.justifyContent = 'center';
								target.parentElement!.style.color = token.colorPrimary;
								target.parentElement!.style.fontSize = '12px';
								if (!target.parentElement!.textContent) {
									target.parentElement!.textContent = t('Meeting Room');
								}
							}}
						/>
					</div>

					{/* Left side - Bottom image frame (Working Professional) */}
					<div
						style={{
							position: 'absolute',
							top: '160px',
							left: '60px',
							width: '200px',
							height: '150px',
							backgroundColor: 'white',
							borderRadius: '16px',
							transform: 'rotate(8deg)',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							padding: '10px',
							transition: 'transform 0.3s ease',
						}}
					>
						<img
							src="/images/working_professional.png"
							alt={t('Working')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '6px',
							}}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = 'none';
								target.parentElement!.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
								target.parentElement!.style.display = 'flex';
								target.parentElement!.style.alignItems = 'center';
								target.parentElement!.style.justifyContent = 'center';
								target.parentElement!.style.color = token.colorPrimary;
								target.parentElement!.style.fontSize = '12px';
								if (!target.parentElement!.textContent) {
									target.parentElement!.textContent = t('Working');
								}
							}}
						/>
					</div>

					{/* Right side - Top large image frame (Team Collaboration) */}
					<div
						style={{
							position: 'absolute',
							top: '0px',
							right: '40px',
							width: '260px',
							height: '195px',
							backgroundColor: 'white',
							borderRadius: '16px',
							transform: 'rotate(4deg)',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							padding: '10px',
							transition: 'transform 0.3s ease',
						}}
					>
						<img
							src="/images/team_collaboration.png"
							alt={t('Team Collaboration')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '8px',
							}}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = 'none';
								target.parentElement!.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
								target.parentElement!.style.display = 'flex';
								target.parentElement!.style.alignItems = 'center';
								target.parentElement!.style.justifyContent = 'center';
								target.parentElement!.style.color = token.colorPrimary;
								target.parentElement!.style.fontSize = '12px';
								if (!target.parentElement!.textContent) {
									target.parentElement!.textContent = t('Team Collaboration');
								}
							}}
						/>
					</div>

					{/* Right side - Bottom small image frame (Working Professional) */}
					<div
						style={{
							position: 'absolute',
							top: '210px',
							right: '80px',
							width: '180px',
							height: '135px',
							backgroundColor: 'white',
							borderRadius: '16px',
							transform: 'rotate(-5deg)',
							boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
							overflow: 'hidden',
							padding: '10px',
							transition: 'transform 0.3s ease',
						}}
					>
						<img
							src="/images/working_professional.png"
							alt={t('Working')}
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'cover',
								borderRadius: '6px',
							}}
							onError={(e) => {
								const target = e.target as HTMLImageElement;
								target.style.display = 'none';
								target.parentElement!.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
								target.parentElement!.style.display = 'flex';
								target.parentElement!.style.alignItems = 'center';
								target.parentElement!.style.justifyContent = 'center';
								target.parentElement!.style.color = token.colorPrimary;
								target.parentElement!.style.fontSize = '12px';
								if (!target.parentElement!.textContent) {
									target.parentElement!.textContent = t('Working');
								}
							}}
						/>
					</div>
				</div>

				{/* Welcome Text */}
				<div
					style={{
						position: 'relative',
						zIndex: 1,
						textAlign: 'center',
						color: 'white',
					}}
				>
					<Typography.Title
						level={2}
						style={{
							color: 'white',
							fontSize: '32px',
							fontWeight: 700,
							marginBottom: '12px',
							lineHeight: '1.2',
						}}
					>
						{t('Empowering People. Simplifying HR.')}
					</Typography.Title>
					<Typography.Text
						style={{
							color: 'white',
							fontSize: '16px',
							display: 'block',
						}}
					>
						{t('Everything you need to support, grow, and manage your workforce.')}
					</Typography.Text>
				</div>
			</div>}

			{/* Right Section - Login Form */}
			<div
				style={{
					width: isPhone ? '100%' : '55%',
					backgroundColor: darkMode ? 'black' : 'white',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignContent: 'center',
					alignItems: 'center',
					padding: isPhone ? '40px' : '50px',
				}}
			>
				<ConfigProvider componentSize="small">
					<div style={{ width: '100%', maxWidth: '450px' }}>
						<Flex vertical justify="center" align="center" style={{ marginBottom: '24px' }}>
							<img
								src={darkMode ? '/images/logo_dark.png' : '/images/logo_light.png'}
								alt={t('HRMX Logo')}
								style={{
									height: '60px',
									marginBottom: '12px',
								}}
								onError={(e) => {
									// Fallback to logo.svg if logo_light.png doesn't exist
									const target = e.target as HTMLImageElement;
									if (target.src.indexOf('logo_light.png') !== -1) {
										target.src = '/icons/logo.svg';
									}
								}}
							/>
							<Typography.Text
								style={{
									color: token.colorTextSecondary,
									fontSize: '14px',
									display: 'block',
									marginTop: '8px',
								}}
							>
								{t('Welcome back! Please enter your details.')}
							</Typography.Text>
						</Flex>

						{authStore.error && (
							<Alert
								message={t('Login Error')}
								description={t(authStore.error)}
								type="error"
								showIcon
								closable
								onClose={() => authStore.clearError()}
								style={{ marginBottom: 24 }}
							/>
						)}

						<Form form={form} layout="vertical" onFinish={onFinish}>
							<Flex vertical gap={20} style={{ marginBottom: '24px' }}>
								<Flex vertical gap={15}>
									<Form.Item
										label={
											<span>
												{t('Company code')} <span style={{ color: 'red' }}>*</span>
											</span>
										}
										name="companyCode"
										rules={[{ required: true, message: t('Please input your company code!') }]}
										required={false}
									>
										<Input
											placeholder={t('Enter company code')}
											autoComplete="organization"
											style={{
												padding: '10px 12px',
												fontSize: '14px',
												height: '44px',
												borderRadius: '6px',
											}}
										/>
									</Form.Item>

									<Form.Item
										label={
											<span>
												{t('Username')} <span style={{ color: 'red' }}>*</span>
											</span>
										}
										name="username"
										rules={[{ required: true, message: t('Please input your username!') }]}
										required={false}
									>
										<Input
											placeholder={t('Enter username')}
											autoComplete="username"
											style={{
												padding: '10px 12px',
												fontSize: '14px',
												height: '44px',
												borderRadius: '6px',
											}}
										/>
									</Form.Item>

									<Form.Item
										label={
											<span>
												{t('Password')} <span style={{ color: 'red' }}>*</span>
											</span>
										}
										name="password"
										rules={[{ required: true, message: t('Please input your password!') }]}
										required={false}
									>
										<Input.Password
											placeholder={t('Enter password')}
											autoComplete="current-password"
											style={{
												padding: '10px 12px',
												fontSize: '14px',
												height: '44px',
												borderRadius: '6px',
											}}
										/>
									</Form.Item>
								</Flex>
								<Button
									type="primary"
									htmlType="submit"
									block
									style={{
										height: '44px',
										fontSize: '16px',
										fontWeight: 500,
										borderRadius: '6px',
									}}
								>
									{t('Login')}
								</Button>


								<Flex justify="center" align="center">
									<Typography.Text style={{ fontSize: '10px', color: token.colorTextTertiary }}>{t('Copyright ⓒ 2026 Cyberlogitec Co.Ltd. All rights reserved')}</Typography.Text>
								</Flex>
							</Flex>
						</Form>
					</div>
				</ConfigProvider>
			</div>
		</div>
	);
});

export default LoginPage;

