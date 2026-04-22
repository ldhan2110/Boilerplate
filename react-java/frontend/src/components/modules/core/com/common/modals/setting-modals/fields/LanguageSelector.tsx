import React from "react";
import { Select } from "antd";
import { observer } from "mobx-react-lite";
import { useAppTranslate } from "@/hooks";
import type { TLang } from "@/types";
import appStore from "@/stores/AppStore";

const { Option } = Select;

const LANGUAGES = [
  { code: "en", label: "English", icon: "/icons/english.svg" },
  { code: "kr", label: "한국어", icon: "/icons/south_korea.svg" },
  { code: "vn", label: "Tiếng Việt", icon: "/icons/vietnam.svg" },
];

const LanguageSelector: React.FC = observer(() => {
  const { changeLanguage } = useAppTranslate();
  const { lang } = appStore.state;

  const handleChange = (value: string) => {
    appStore.setLang(value as TLang);
    changeLanguage(value);
  };

  const renderOption = (lang: (typeof LANGUAGES)[0]) => (
    <Option key={lang.code} value={lang.code}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span role="img" aria-label={lang.label} style={{ marginRight: 8 }}>
          <img
            src={lang.icon}
            alt={lang.label}
            style={{ width: 25, height: 25, objectFit: "contain", display: "block" }}
          />
        </span>
        {lang.label}
      </span>
    </Option>
  );

  return (
    <Select value={lang} onChange={handleChange} style={{ width: 110 }}>
      {LANGUAGES.map(renderOption)}
    </Select>
  );
});

export default LanguageSelector;
