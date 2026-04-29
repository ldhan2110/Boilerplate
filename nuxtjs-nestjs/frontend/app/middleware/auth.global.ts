export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  const publicRoutes = ['/login', '/']

  if (!userStore.isAuthenticated && !publicRoutes.includes(to.path)) {
    return navigateTo('/login')
  }

  if (userStore.isAuthenticated && to.path === '/login') {
    return navigateTo('/')
  }
})
