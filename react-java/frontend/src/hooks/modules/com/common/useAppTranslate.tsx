import { useTranslation } from "react-i18next";

import koKR from "antd/lib/locale/ko_KR";
import enUS from "antd/lib/locale/en_US";
import vnVN from "antd/lib/locale/vi_VN";
import appStore from "@/stores/AppStore";
import { loadBackendTranslations } from "@/i18n";

export const useAppTranslate = () => {
  const { lang } = appStore.state;
  const { t, i18n } = useTranslation();

  function changeLanguage(language: string) {
    i18n.changeLanguage(language);
    loadBackendTranslations(language);
  }

  function getAntdLocale() {
    switch (lang) {
      case "en":
        return enUS;
      case "kr":
        return koKR;
      case "vn":
        return vnVN;
      default:
        return enUS; // Fallback to English
    }
  }

  function m(messageCode: string) {
    return t(messageCode, { ns: 'messages' });
  }

  return {
    t,
    locale: getAntdLocale(),
    m,
    changeLanguage,
    lang,
  };
};
