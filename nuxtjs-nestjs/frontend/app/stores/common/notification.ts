import { defineStore } from 'pinia'

export interface AppNotification {
  id: string
  icon: string
  message: string
  time: string
  read: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([
    {
      id: '1',
      icon: 'pi pi-user-plus',
      message: 'New user registered: John Doe',
      time: '5 min ago',
      read: false
    },
    {
      id: '2',
      icon: 'pi pi-shield',
      message: 'Role "Editor" was updated',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      icon: 'pi pi-cog',
      message: 'System settings changed',
      time: '3 hours ago',
      read: true
    }
  ])

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  function markAllRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function markRead(id: string) {
    const n = notifications.value.find(n => n.id === id)
    if (n) n.read = true
  }

  return { notifications, unreadCount, markAllRead, markRead }
})
