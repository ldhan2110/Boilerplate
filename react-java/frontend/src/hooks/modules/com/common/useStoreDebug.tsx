import { useCallback } from "react";
import { message, App } from "antd";
import store from "@/stores/AppStore";

/**
 * Hook để quản lý store statistics và debugging
 */
export const useStoreDebug = () => {
  const { modal } = App.useApp();

  const getStateSnapshot = useCallback(() => {
    return store.getStateSnapshot();
  }, []);

  const forceSave = useCallback(async () => {
    await store.forceSave();
    message.success("Persist state successfully.");
  }, []);

  const resetToDefault = useCallback(async () => {
    modal.confirm({
      title: "Confirmation",
      content:
        "Are you sure you want to reset all data to default? This action cannot be undone.",
      okText: "Reset",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        await store.resetToDefault();
        message.success("Reset to default state successfully.");
      },
    });
  }, [modal]);

  return {
    initialized: store.initialized,
    getStateSnapshot,
    forceSave,
    resetToDefault,
  };
};
