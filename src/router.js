import Vue from 'vue'
import Router from 'vue-router'
import store from './store'
import AppStore from './components/AppStore.vue'
import MyApps from './components/MyApps.vue'
import Users from './components/Users.vue'
import Mail from './components/Mail.vue'
import Calendar from './components/Calendar.vue'
import UserFiles from './components/UserFiles.vue'
import UserProfile from './components/UserProfile.vue'
import ViewUserData from './components/ViewUserData.vue'
import Login from './components/Login.vue'
import AuditLog from './components/AuditLog'
import Alerts from './components/Alerts'
import EventLog from './components/EventLog'
import Organizations from './components/Organizations'
import AppPageReset from './components/AppPageReset'
import OrganizationAppPane from './components/OrganizationAppPane'
import OrganizationCalendar from './components/OrganizationCalendar'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: MyApps,
      alias: '/home'
    },
    {
      path: '/mail',
      name: 'mail',
      component: Mail
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: Calendar
    },
    {
      path: '/appstore',
      name: 'AppStore',
      component: AppStore
    },
    {
      path: '/myapps',
      name: 'MyApps',
      component: MyApps
    },
    {
      path: '/apppagereset',
      name: 'AppPageReset',
      component: AppPageReset
    },
    {
      path: '/myprofile',
      name: 'MyProfile',
      component: UserProfile
    },
    {
      path: '/organizationapppane',
      name: 'OrganizationAppPane',
      component: OrganizationAppPane
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/users',
      name: 'users',
      component: Users
    },
    {
      path: '/userFiles',
      name: 'userFiles',
      component: UserFiles
    },
    {
      path: '/viewuserdata',
      name: 'ViewUserData',
      component: ViewUserData
    },
    {
      path: '/organizationcalendar',
      name: 'organizationCalendar',
      component: OrganizationCalendar
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: Organizations
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: Alerts
    },
    {
      path: '/auditlog',
      name: 'auditLog',
      component: AuditLog
    },
    {
      path: '/eventlog',
      name: 'eventLog',
      component: EventLog
    }
/*,
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(** webpackChunkName: "about" ** './views/About.vue')
    }*/
  ]
})
router.beforeEach((to, from, next) => {
  if(to.matched.some(record => (record.name!='login'))) {
    if (store.getters.isLoggedIn) {
      if (to.matched[0].props.default && to.matched[0].props.default.apAuthReqd && (
        store.state.user.rolesMap['SYSADMIN']==null)) {
          store.commit('SET_ERRMSG', 'Unauthorized access');
          next('/')
          return;
      }
      next()
      return
    }
    next('/login') 
  } else {
    next() 
  }
})
export default router
