import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import { authService } from './services/auth/authJwtService';

// Loading translation files
import en from './locales/en.json';
import kr from './locales/kr.json';
import vn from './locales/vn.json';

i18n
	.use(HttpBackend) // Loads translations from backend
	.use(initReactI18next) // Passes i18n instance to react-i18next
	.init({
		resources: {
			en: {
				translation: en,
			},
			kr: {
				translation: kr,
			},
			vn: {
				translation: vn,
			},
		},
		partialBundledLanguages: true,
		ns: ['translation', 'messages'], // Define namespaces
		lng: 'en', // Default language
		fallbackLng: 'en', // Fallback language
		interpolation: {
			escapeValue: false, // React already does escaping
		},
	});


export async function loadBackendTranslations(lang: string) {
	try {
		const token = authService.getAccessToken();
		const res = await fetch(`${import.meta.env.VITE_API_URL}/sys/comMsg/getI18nMessages/${lang}`, {
			method: "GET",
			headers: {
			  "Content-Type": "application/json",
			  "Authorization": `Bearer ${token}`,
			},
		});
		if (!res.ok) return;
		const backendTranslations = await res.json();
		i18n.addResources(lang, "messages", backendTranslations);
		// Note: Don't call appStore.setLang here to avoid infinite loops
		// The store should be updated separately before calling this function
	} catch (error) {
		console.error('Error loading backend translations:', error);
	}
}

export default i18n;
