<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-brand">
        <img src="/logo.png" alt="Logo" class="logo" />
        <span v-if="!isSidebarCollapsed" class="brand-name">Temp Mail</span>
      </div>

      <nav class="nav-menu">
        <router-link to="/dashboard/home" class="nav-item" active-class="active">
          <i class="pi pi-chart-bar"></i>
          <span v-if="!isSidebarCollapsed">Dashboard</span>
        </router-link>
        
        <router-link to="/dashboard/accounts" class="nav-item" active-class="active">
          <i class="pi pi-users"></i>
          <span v-if="!isSidebarCollapsed">Account Management</span>
        </router-link>
        
        <router-link to="/dashboard/webmail" class="nav-item" active-class="active">
          <i class="pi pi-envelope"></i>
          <span v-if="!isSidebarCollapsed">Webmail client</span>
        </router-link>
        
        <router-link to="/dashboard/settings" class="nav-item" active-class="active">
          <i class="pi pi-cog"></i>
          <span v-if="!isSidebarCollapsed">Settings</span>
        </router-link>
      </nav>

      <div class="sidebar-toggle" @click="toggleSidebar">
        <i :class="isSidebarCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-left'"></i>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-container">
      <!-- Top Navbar -->
      <header class="navbar">
        <div class="navbar-left">
          <span class="page-title">{{ currentRouteName }}</span>
        </div>
        
        <div class="navbar-right">
          <div class="user-profile">
            <span class="avatar">{{ userInitials }}</span>
            <div class="user-info">
              <span class="username">{{ currentUser?.username }}</span>
              <span class="role">{{ currentUser?.role }}</span>
            </div>
          </div>
          
          <p-button 
            icon="pi pi-sign-out" 
            label="Logout" 
            class="p-button-text p-button-secondary logout-button" 
            @click="handleLogout" 
          />
        </div>
      </header>

      <!-- Sub Page Router View -->
      <main class="content-view">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()
const route = useRoute()
const isSidebarCollapsed = ref(false)

const currentUser = computed(() => authService.getCurrentUser())

const userInitials = computed(() => {
  const name = currentUser.value?.username || 'Admin'
  return name.substring(0, 2).toUpperCase()
})

const currentRouteName = computed(() => {
  switch (route.name) {
    case 'DashboardHome':
      return 'Dashboard Overview'
    case 'Accounts':
      return 'Account Management'
    case 'Webmail':
      return 'Webmail Center'
    case 'Settings':
      return 'System Settings'
    default:
      return 'Dashboard'
  }
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

.app-layout {
  font-family: 'Inter', sans-serif;
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f8fafc;
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-right: 1px solid #1e293b;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-brand {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  border-bottom: 1px solid #1e293b;
  overflow: hidden;
}

.logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.nav-menu {
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 8px;
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.nav-item i {
  font-size: 18px;
  flex-shrink: 0;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: #f8fafc;
}

.nav-item.active {
  background-color: #0ea5e9;
  color: #ffffff;
}

.sidebar-toggle {
  height: 40px;
  border-top: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: color 0.2s;
}

.sidebar-toggle:hover {
  color: #f8fafc;
}

/* Main Container Styles */
.main-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

/* Navbar Styles */
.navbar {
  height: 70px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  flex-shrink: 0;
}

.page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  border-right: 1px solid #e2e8f0;
  padding-right: 20px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.username {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.2;
}

.role {
  font-size: 11px;
  color: #64748b;
}

.logout-button {
  color: #64748b !important;
  font-weight: 500;
  font-size: 14px;
}

.logout-button:hover {
  color: #ef4444 !important;
}

/* Content Area */
.content-view {
  flex-grow: 1;
  overflow-y: auto;
  padding: 30px;
  box-sizing: border-box;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    height: 100vh;
    z-index: 1000;
  }
  .sidebar.collapsed {
    width: 0;
    border: none;
    overflow: hidden;
  }
}
</style>
