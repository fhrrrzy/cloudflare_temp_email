import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/authService'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/dashboard',
      component: () => import('../views/Layout.vue'),
      redirect: '/dashboard/home',
      children: [
        {
          path: 'home',
          name: 'DashboardHome',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('../views/Accounts.vue')
        },
        {
          path: 'webmail',
          name: 'Webmail',
          component: () => import('../views/Webmail.vue'),
          props: route => ({ initialEmail: route.query.email || null })
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('../views/Settings.vue')
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// Authentication navigation guard
router.beforeEach((to, from, next) => {
  const authenticated = authService.isAuthenticated()

  if (to.path.startsWith('/dashboard') && !authenticated) {
    next('/login')
  } else if (to.path === '/login' && authenticated) {
    next('/dashboard')
  } else if (to.path === '/') {
    next(authenticated ? '/dashboard' : '/login')
  } else {
    next()
  }
})

export default router
