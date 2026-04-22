import './SettingModal.scss';
import { message, Modal } from 'antd';
import { GlobalOutlined, CalendarOutlined, BulbOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useAppTranslate, useSaveUserSetting } from '@hooks';
import { observer } from 'mobx-react-lite';
import { MESSAGE_CODES } from '@/constants';
import { authService } from '@services/auth/authJwtService';
import appStore from '@stores/AppStore';
import LanguageSelector from './fields/LanguageSelector';
import GlobalFormatDateSelector from './fields/GlobalFormatDateSelector';
import DarkModeToggle from './fields/DarkModeToggle';
import PrimaryColorSelector from './fields/PrimaryColorSelector';

type SettingModalProps = {
	isOpen: boolean;
	handleClose?: () => void;
};

export const SettingModal = observer(({ isOpen, handleClose }: SettingModalProps) => {
	const { t, m } = useAppTranslate();

	const { mutate: saveUserSetting } = useSaveUserSetting({
		onSuccess: () => {
			handleClose?.();
		},
		onError: (error) => {
			console.log(error);
			message.error(m(error.errorCode || MESSAGE_CODES.SYSMESSAGE));
		},
	});

	function handleSaveUserSetting() {
		saveUserSetting({
			coId: authService.getCurrentCompany()!,
			usrId: authService.getCurrentUser()!.userInfo.usrId!,
			langVal: appStore.state.lang,
			dtFmtVal: appStore.state.dateFormat,
			sysModVal: appStore.state.darkMode ? 'dark' : 'light',
			sysColrVal: appStore.state.primaryColor,
		});
	}

	async function handleBeforeCloseModal() {
		try {
			await handleSaveUserSetting();
			handleClose?.();
		} catch {
			return;
		}
	}

	return (
		<Modal
			title={
				<span>
					<BulbOutlined />
					{t('Setting')}
				</span>
			}
			closable={true}
			open={isOpen}
			centered
			onCancel={handleBeforeCloseModal}
			okButtonProps={{ style: { display: 'none' } }}
			cancelText={t('Close')}
			className="setting-modal"
			width={520}
		>
			<div className="setting-modal__content">
				<div className="setting-modal__item">
					<div className="setting-modal__item__info">
						<div className="setting-modal__item__icon">
							<GlobalOutlined />
						</div>
						<div className="setting-modal__item__label-wrapper">
							<h4 className="setting-modal__item__label">{t('Language')}</h4>
							<p className="setting-modal__item__description">
								{t('Select your preferred language')}
							</p>
						</div>
					</div>
					<div className="setting-modal__item__control">
						<LanguageSelector />
					</div>
				</div>

				<div className="setting-modal__item">
					<div className="setting-modal__item__info">
						<div className="setting-modal__item__icon">
							<CalendarOutlined />
						</div>
						<div className="setting-modal__item__label-wrapper">
							<h4 className="setting-modal__item__label">{t('Date Format')}</h4>
							<p className="setting-modal__item__description">
								{t('Choose how dates are displayed')}
							</p>
						</div>
					</div>
					<div className="setting-modal__item__control">
						<GlobalFormatDateSelector />
					</div>
				</div>

				<div className="setting-modal__item">
					<div className="setting-modal__item__info">
						<div className="setting-modal__item__icon">
							<BulbOutlined />
						</div>
						<div className="setting-modal__item__label-wrapper">
							<h4 className="setting-modal__item__label">{t('Dark Mode')}</h4>
							<p className="setting-modal__item__description">
								{t('Toggle between light and dark theme')}
							</p>
						</div>
					</div>
					<div className="setting-modal__item__control setting-modal__item__control--dark-mode">
						<DarkModeToggle />
					</div>
				</div>

				<div className="setting-modal__item">
					<div className="setting-modal__item__info">
						<div className="setting-modal__item__icon">
							<BgColorsOutlined />
						</div>
						<div className="setting-modal__item__label-wrapper">
							<h4 className="setting-modal__item__label">{t('Primary Color')}</h4>
							<p className="setting-modal__item__description">
								{t('Choose your primary theme color')}
							</p>
						</div>
					</div>
					<div className="setting-modal__item__control">
						<PrimaryColorSelector />
					</div>
				</div>
			</div>
		</Modal>
	);
});
