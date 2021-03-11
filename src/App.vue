<template>
  <v-app light>
  <v-dialog v-model="pwdDialog" max-width="500px" @keydown.esc.prevent="pwdDialog = false" >
    <v-card>
      <v-card-title><span class="text-h5">Change Password</span></v-card-title>
      <v-card-text>
        <v-alert dismissible :value="showPwdErrMsg" type="error">{{pwdErrMsg}}</v-alert>
         <v-form ref="pwdChgForm" v-model="pwdValid" lazy-validation>
            <v-text-field type="password" v-model="chgPwdObj.newPassword" label="New Password" required :rules="[rules.required]" ></v-text-field>
            <v-text-field type="password" :error-messages="confPwdErrMsg" v-model="chgPwdObj.newPassword2" label="Confirm Password" required :rules="[rules.required]" ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn elevation="2" color="blue darken-1" text @click="pwdDialog = false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn elevation="2" color="blue darken-1" text @click.native="savePwdChange"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- v-if="user.rolesMap['SYSADMIN']  || this.isVendor" -->
    <v-navigation-drawer 
      width="300px"
      :mini-variant="miniVariant"
      clipped
      v-model="leftDrawer"
      disable-resize-watcher
      dark
      class="light-blue darken-4"
      fixed
      app
    >
      <v-list dark>
        <v-list-item 
          value="true"
          v-for="(item, i) in menuItems"
          :key="i"
          @click="gotoItem(item)"
        >
          <v-list-item-content>
            <v-list-item-title v-text="item.title" class="white--text"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar :style="{background: 'linear-gradient(to bottom, #00528d 0%, #0071C2 100%)'}"
      app
      clipped-left
      clipped-right
    >
    <!-- (user.rolesMap['SYSADMIN']) &&  -->
      <v-app-bar-nav-icon v-if="$route.name!='login'" class="white--text text--accent-2" @click.stop="leftDrawer = !leftDrawer"></v-app-bar-nav-icon>
      <v-tooltip v-if="$route.name!='home' && $route.name!='login'" bottom color="#2572d2" light>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon :to="user.rolesMap['VENDOR']?'/vendorcalendar':'/home'" v-bind="attrs" v-on="on">
            <v-icon color="yellow accent-2">mdi-home</v-icon>
          </v-btn>
        </template>
        <span>Home</span>
      </v-tooltip>
      <v-tooltip v-if="$route.name!='home' && $route.name!='login'" bottom color="#2572d2" light>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" icon @click="goBack">
            <v-icon color="yellow accent-2">mdi-arrow-left</v-icon>
          </v-btn>
        </template>
        <span>Go back</span>
      </v-tooltip>
      <v-toolbar-title v-text="title" class="white--text text--accent-2" @click="goHome" style="cursor:pointer"></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-alert class="mt-auto" dark elevation="12" transition="slide-y-reverse-transition" dismissible v-model="showGlobalAlert" :type="globalAlert.type||'success'">{{globalAlert.msg}}</v-alert>
      <v-spacer></v-spacer>
      <span v-if="isLoggedIn" class="white--text">{{user.name}}&nbsp;&nbsp;&nbsp;&nbsp;<a class="black--text" @click="logout"><b>Logout</b></a></span>
      <!--v-spacer></v-spacer>
      <v-btn icon @click.stop="rightDrawer = !rightDrawer">
        <v-icon color="yellow accent-2">mdi-menu</v-icon>
      </v-btn-->
    </v-app-bar>
    <v-content>
      <router-view/>
    </v-content>
    <v-footer :fixed="fixed" app :style="{background: 'linear-gradient(to bottom, #00528d 0%, #0071C2 100%)'}">
      <span class="white--text">&copy; CloudHaven @ 2020-2021 &nbsp;&nbsp;(v0.01)</span>
    </v-footer>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from './event-bus.js';
import Api from '@/services/Api'
import router from './router'
export default {
  name: 'App',
  data () {
    return {
      showPwdErrMsg: false,
      pwdErrMsg: '',
      showGlobalAlert: false,
      errorDisplayed: '',
      globalAlert: {type:'success', msg:''},
      clipped: true,
      leftDrawer: false,
      fixed: false,
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'CloudHaven',
      pwdDialog: false,
      pwdValid: true,
      chgPwdObj: {},
      confPwdErrMsg:'',
      rules:{
          required: value => !!value || 'Required.'
      }
    }
  },
  created() {
    EventBus.$on('errors:401', () => {
      this.$router.push('/login');
    })
    EventBus.$on('global success alert', (msg) => {
      this.globalAlert.type = 'success';
      this.globalAlert.msg = msg;
      this.showGlobalAlert = true;
    })
    EventBus.$on('global error alert', (msg) => {
      this.globalAlert.type = 'error';
      this.globalAlert.msg = msg;
      this.showGlobalAlert = true;
      if (!this.errorDisplayed != msg) {
        setTimeout(() => {
          this.showGlobalAlert = false;
          this.errorDisplayed = ''
        }, 10000)
        this.errorDisplayed = msg;
      }
    })
  },
  watch:{
    $route () {
        this.leftDrawer = false;
    },
    isVendor() {
      this.goHome();
    },
    pwdDialog (val) {
      if (val) {
        this.$store.commit('SET_RESULTNOTIFICATION', '')
      } else {
        this.closePwdDlg()
      }
    }
  },
  mounted() {
    if (!this.user._id) {
      this.$store.commit('reload_user');
      this.goHome();
    }
  },
  computed: {
    isLoggedIn : function(){ return this.$store.getters.isLoggedIn},
    ...mapState([ 'user' ]),
    isVendor() {
      return this.user.rolesMap['VENDOR']!=null;
    },
    menuItems() {
//      if (this.user.rolesMap['SYSADMIN']) {
        return [
        { route: 'MyApps', action: '', title: 'My Apps' },
        { route: 'AppStore', action: '', title: 'App Store' },
        { route: 'UISandbox', action: '', title: 'UI Sandbox' },
        { route: 'vendors', action: '', title: 'Vendors' },
        { route: 'users', action: '', title: 'Users' }/*,
        { route: 'auditLog', action: '', title: 'Audit Log'},
        { route: 'eventLog', action: '', title: 'Event Log'}*/
        ];
/*      } else if (this.isVendor) {
        return [
        { route: 'vendorcalendar', action: '', title: 'Vendor Calendar'},
        { route: null, action: this.chgPwd, title: 'Change Password'}
        ];
      }
      return [];*/
    }
  },
  methods: {
    goHome() {
      if (this.isVendor) {
        if (this.$router.currentRoute.name != 'vendorCalendar') {
          this.$router.push('/vendorcalendar');
        }
      } else {
        if (this.$router.currentRoute.name != 'home') {
          this.$router.push('/home');
        }
      }
      this.leftDrawer = false;
    },
    goBack() {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      router.go(-1);
    },
    chgPwd() {
      this.chgPwdObj = {};
      this.pwdDialog = true;
    },
    savePwdChange() {
      this.confPwdErrMsg = '';
      if (this.chgPwdObj.newPassword != this.chgPwdObj.newPassword2) {
        this.confPwdErrMsg = 'Confirmation password does not match.';
        return;
      }
      if (!this.$refs.pwdChgForm.validate()) return;
      (async () => {
        this.chgPwdObj._id = this.user._id;
        var response = await Api().post('/chgpwd', this.chgPwdObj );
        if (response.data.success) {
          this.$store.commit('SET_SUCCESS', `Password changed.`)
        } else if (response.data.errMsg) {
          this.pwdErrMsg = response.data.errMsg;
          this.showPwdErrMsg = true;
        }
        this.pwdDialog = false;
      })();
    },
    closePwdDlg () {
      setTimeout(() => {
        this.chgPwdObj = {}
      }, 300)
    },
    logout() {
      this.$store.dispatch('logout')
      .then(() => {
        this.$router.push('/login')
      })
    },
    gotoItem (item ) {
      if (item.route) {
        if (item.route == this.$router.currentRoute.name) {
          EventBus.$emit(`${item.route} data refresh`);
        } else {
          router.push({name:item.route});
        }
      } else {
        (item.action)();
      }
    }
  }
}
</script>
