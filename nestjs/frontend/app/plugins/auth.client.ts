export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  await userStore.restoreSession()
})
