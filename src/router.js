import Vue from 'vue'
import Router from 'vue-router'
import store from './store'
import AppStore from './components/AppStore.vue'
import MyApps from './components/MyApps.vue'
import UISandbox from './components/UISandbox.vue'
import Users from './components/Users.vue'
import UserProfile from './components/UserProfile.vue'
import ViewUserData from './components/ViewUserData.vue'
import Login from './components/Login.vue'
import AuditLog from './components/AuditLog'
import Alerts from './components/Alerts'
import EventLog from './components/EventLog'
import Vendors from './components/Vendors'
import AppPageReset from './components/AppPageReset'
import VendorAppPane from './components/VendorAppPane'
import SchedulingCalendar from './components/SchedulingCalendar'
import VendorCalendar from './components/VendorCalendar'

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
      path: '/uisandbox',
      name: 'UISandbox',
      component: UISandbox
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
      path: '/vendorapppane',
      name: 'VendorAppPane',
      component: VendorAppPane
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
      path: '/viewuserdata',
      name: 'ViewUserData',
      component: ViewUserData
    },
    {
      path: '/vendorcalendar',
      name: 'vendorCalendar',
      component: VendorCalendar
    },
    {
      path: '/schedulingcalendar',
      name: 'schedulingCalendar',
      component: SchedulingCalendar
    },
    {
      path: '/vendors',
      name: 'vendors',
      component: Vendors
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
