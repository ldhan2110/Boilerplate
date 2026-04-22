import { FormFieldset, FormImageViewer, FormInput, FormTextArea } from '@/components/common/form';
import { CommonFormModal } from '@/components/common/modals';
import { MESSAGE_CODES } from '@/constants';
import { useChangeUserInfo, useGetUserInfo } from '@/hooks/modules';
import { authService } from '@/services/auth/authJwtService';
import type { UserInfoDto } from '@/types';
import { CameraOutlined } from '@ant-design/icons';
import { useAppForm, useAppTranslate } from '@hooks';
import { authStore } from '@stores/AuthStore';
import { App, Col, Flex, Form, Row } from 'antd';
import { useMemo, useRef } from 'react';

// Password policy pattern (must include uppercase, lowercase, number, and special character, min 8 chars)
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Phone number pattern (allows numbers, +, -, spaces, and parentheses)
// Note: - is placed at the end of character class to avoid being interpreted as range
const PHONE_PATTERN = /^[0-9+\s()-]*$/;

type UserProfileModalProps = {
	open: boolean;
	onClose: () => void;
};

export const UserProfileModal = ({ open, onClose }: UserProfileModalProps) => {
	const { t, m } = useAppTranslate();
	const { message } = App.useApp();

	// Get current user ID from authStore
	const currentUserId = authStore.user?.userInfo?.usrId;
	const currentCompanyId = authService.getCurrentCompany();

	// Fetch user info using the hook
	const { data: userInfo, isLoading } = useGetUserInfo({
		usrId: currentUserId || '',
		coId: currentCompanyId || '',
	});

	const form = useAppForm<
		UserInfoDto & { currentPassword?: string; newPassword?: string; confirmPassword?: string }
	>({
		formName: 'userProfile',
		initialValues: userInfo,
	});

	// Watch usrFile to reactively update UI
	const usrFile = Form.useWatch('usrFile', form);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { mutate: changeUserInfo, isPending: isUpdating } = useChangeUserInfo({
		onSuccess: () => {
			message.success(m(MESSAGE_CODES.ADM000019));
			handleCloseModal();
		},
		onError: (err) => {
			console.log(err);
			message.error(m(err.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	// Get user ID for avatar letter
	let rawSub = authStore.user?.sub;
	if (!rawSub) {
		rawSub = localStorage.getItem('userSub') || 'Unknown User';
	}
	const userId = rawSub.includes('::') ? rawSub.split('::')[1] : rawSub;
	const avatarLetter = userId.charAt(0).toUpperCase();

	// Random background color for avatar (consistent with Header)
	const randomBgColor = useMemo(() => {
		const randomColor = () =>
			'#' +
			Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, '0');
		return randomColor();
	}, []);

	async function handleUpdateUserInfo() {
		try {
			const formValues = await form.validateFields();
			// Destructure roleNm
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { roleNm, ...restValues } = formValues;
			// Prepare payload
			const payload = {
				coId: currentCompanyId || '',
				usrId: currentUserId || '',
				roleId: userInfo?.roleId || '',
				...restValues,
			};
			changeUserInfo(payload);
		} catch {
			return;
		}
	}

	function handleCloseModal() {
		// Reset form to initial values and update initialValuesRef
		form.resetFields();
		if (userInfo) {
			form.setInitialFieldsValue(userInfo);
		}
		onClose();
	}

	function handleBeforeCloseModal() {
		form.checkUnsavedFormChange(handleCloseModal);
	}

	return (
		<CommonFormModal
			title={t('User Profile')}
			open={open}
			form={form}
			onConfirm={handleUpdateUserInfo}
			onCancel={handleBeforeCloseModal}
			width={700}
			okText={t('Save Changes')}
			cancelText={t('Cancel')}
			loading={isLoading}
			confirmLoading={isUpdating}
			initialValues={userInfo}
		>
			<div className="max-h-[70vh] overflow-y-auto pr-2">
				<Flex vertical gap={16} className="!mt-2">
					{/* Account Information Section */}
					<Row gutter={16}>
						{/* Row 1: Avatar + Full Name, Email, Phone */}
						<Col span={24}>
							<FormFieldset title={t('Account Information')}>
								<Row gutter={[16, 16]} align={'middle'}>
									{/* Row 1: Avatar + Full Name, Email, Phone */}
									<Col span={6}>
										<Flex align="center" justify="center">
											<div
												className="relative inline-block group cursor-pointer"
												onClick={() => fileInputRef.current?.click()}
											>
												<input
													ref={fileInputRef}
													type="file"
													accept="image/*"
													style={{ display: 'none' }}
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) {
															form.setFieldValue('usrFile', file);
														}
														e.target.value = '';
													}}
												/>
												<FormImageViewer
													name="usrFile"
													label=""
													fileId={userInfo?.usrFileDto?.fileId ?? userInfo?.usrFileId}
													fileCoId={userInfo?.usrFileDto?.coId ?? (currentCompanyId || '')}
													width={120}
													height={120}
													showUpload={false}
													showReset={false}
													showView={false}
													showZoomControls={false}
													style={{
														borderRadius: '50%',
														overflow: 'hidden',
														border: '4px solid #fff',
														boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
													}}
												/>
												{!usrFile && (
													<div
														className="absolute top-0 left-0 w-[120px] h-[120px] rounded-full flex items-center justify-center text-white font-bold pointer-events-none -z-10 border-4 border-white"
														style={{
															backgroundColor: randomBgColor,
															fontSize: 56,
															boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
														}}
													>
														{avatarLetter}
													</div>
												)}
												<div className="absolute inset-0 w-[120px] h-[120px] rounded-full flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-80 transition-opacity pointer-events-none z-10">
													<CameraOutlined className="text-white text-3xl" />
												</div>
											</div>
										</Flex>
									</Col>
									<Col span={18}>
										<Row gutter={16}>
											<Col span={8}>
												<FormInput
													height={'25px'}
													name="usrNm"
													label={t('Full Name')}
													placeholder={t('Enter Full Name')}
													required
													rules={[
														{
															min: 3,
															message: t('Full name must be at least 3 characters'),
														},
													]}
												/>
											</Col>
											<Col span={8}>
												<FormInput
													height={'25px'}
													name="usrEml"
													label={t('Email')}
													placeholder={t('Enter Email')}
													rules={[
														{
															type: 'email',
															message: t('Please enter a valid email address!'),
														},
													]}
												/>
											</Col>
											<Col span={8}>
												<FormInput
													height={'25px'}
													name="usrPhn"
													label={t('Phone')}
													placeholder={t('Enter Phone Number')}
													maxLength={15}
													rules={[
														{
															pattern: PHONE_PATTERN,
															message: t(
																'Phone number can only contain numbers and +, -, spaces, parentheses',
															),
														},
													]}
												/>
											</Col>
										</Row>
										<Row gutter={16}>
											<Col span={12}>
												<FormInput
													height={'25px'}
													name="coId"
													label={t('Company Code')}
													placeholder={t('Company Code')}
													disabled
												/>
											</Col>
											<Col span={12}>
												<FormInput
													height={'25px'}
													name="roleNm"
													label={t('Role')}
													placeholder={t('Select Role')}
													disabled
												/>
											</Col>
										</Row>
										<Row gutter={16}>
											<Col span={24}>
												<FormTextArea
													name="usrAddr"
													label={t('Address')}
													placeholder={t('Enter Address')}
													maxLength={200}
													autoSize={{ minRows: 2, maxRows: 4 }}
												/>
											</Col>
										</Row>
									</Col>
								</Row>
							</FormFieldset>
						</Col>
					</Row>

					{/* Row 2: Change Password - Full Width */}
					<FormFieldset title={t('Change Password')}>
						<Row gutter={12}>
							<Col span={8}>
								<FormInput
									height={'25px'}
									name="currentPassword"
									label={t('Current Password')}
									placeholder={t('Enter current password')}
									type="password"
									autoComplete="off"
									dependencies={['newPassword', 'confirmPassword']}
									rules={[
										({ getFieldValue }) => ({
											validator(_, value) {
												const newPassword = getFieldValue('newPassword');
												const confirmPassword = getFieldValue('confirmPassword');
												// Only require current password if new password or confirm password is provided
												if (newPassword || confirmPassword) {
													if (!value) {
														return Promise.reject(new Error(t('Current password is required')));
													}
												}
												return Promise.resolve();
											},
										}),
									]}
								/>
							</Col>
							<Col span={8}>
								<FormInput
									height={'25px'}
									name="newPassword"
									label={t('New Password')}
									placeholder={t('Enter new password')}
									type="password"
									dependencies={['currentPassword', 'confirmPassword']}
									rules={[
										({ getFieldValue }) => ({
											validator(_, value) {
												const currentPassword = getFieldValue('currentPassword');
												const confirmPassword = getFieldValue('confirmPassword');
												// Only require new password if current password or confirm password is provided
												if (currentPassword || confirmPassword) {
													if (!value) {
														return Promise.reject(
															new Error(
																t('New password is required when current password is provided'),
															),
														);
													}
													// Validate minimum length
													if (value.length < 8) {
														return Promise.reject(
															new Error(t('Password must be at least 8 characters')),
														);
													}
													// Validate password policy (uppercase, lowercase, number, special character)
													if (!PASSWORD_PATTERN.test(value)) {
														return Promise.reject(
															new Error(
																t(
																	'Password must include uppercase, lowercase, number, and special character',
																),
															),
														);
													}
												}
												return Promise.resolve();
											},
										}),
									]}
								/>
							</Col>
							<Col span={8}>
								<FormInput
									height={'25px'}
									name="confirmPassword"
									label={t('Confirm Password')}
									placeholder={t('Enter confirm password')}
									type="password"
									dependencies={['newPassword', 'currentPassword']}
									rules={[
										({ getFieldValue }) => ({
											validator(_, value) {
												const newPassword = getFieldValue('newPassword');
												const currentPassword = getFieldValue('currentPassword');
												// Only require confirm password if new password or current password is provided
												if (newPassword || currentPassword) {
													if (!value) {
														return Promise.reject(
															new Error(
																t('Confirm password is required when current password is provided'),
															),
														);
													}
													if (newPassword && value !== newPassword) {
														return Promise.reject(new Error(t('Passwords do not match')));
													}
												}
												// If only confirm password is provided without new password, check if it matches (shouldn't happen but handle it)
												if (value && newPassword && value !== newPassword) {
													return Promise.reject(new Error(t('Passwords do not match')));
												}
												return Promise.resolve();
											},
										}),
									]}
								/>
							</Col>
						</Row>
					</FormFieldset>
				</Flex>
			</div>
		</CommonFormModal>
	);
};
