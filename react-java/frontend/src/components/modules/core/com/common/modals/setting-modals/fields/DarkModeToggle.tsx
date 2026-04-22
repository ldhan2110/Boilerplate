import React from "react";
import { Switch, Space } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { useAppTranslate } from "@/hooks";
import appStore from "@/stores/AppStore";

const DarkModeToggle: React.FC = observer(() => {
  const { t } = useAppTranslate();
  const { darkMode } = appStore.state;

  const handleChange = (checked: boolean) => {
    appStore.setDarkMode(checked);
  };

  return (
    <Space>
      <span>{t("Dark Mode")}</span>
      <Switch
        checked={darkMode}
        onChange={handleChange}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
      />
    </Space>
  );
});

export default DarkModeToggle;
