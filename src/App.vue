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
  <!-- v-if="user.rolesMap['SYSADMIN']  || this.isOrganization" -->
    <v-navigation-drawer v-if="user.status=='Active'"
      width="300px"
      :mini-variant="miniVariant" 
      clipped
      v-model="leftDrawer"
      disable-resize-watcher
      dark
      class="light-blue darken-4"
      app
      :style="{ top: $vuetify.application.top + 'px', zIndex: 4 }"
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
    <v-app-bar :style="this.appDetails.appBarStyle" app dense clipped-left >
    <!-- (user.rolesMap['SYSADMIN']) &&  -->
      <v-app-bar-nav-icon v-if="$route.name!='login' && user.status=='Active'" :class="appDetails.appBarTextClass" @click.stop="leftDrawer = !leftDrawer"></v-app-bar-nav-icon>
      <v-tooltip v-if="showHomeIcon" bottom color="#2572d2" light>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon @click="goHome" v-bind="attrs" v-on="on">
            <v-icon color="yellow accent-2">mdi-home</v-icon>
          </v-btn>
        </template>
        <span>Home</span>
      </v-tooltip>
      <v-tooltip bottom color="#2572d2" light>
        <template v-slot:activator="{ on, attrs }">
          <div class="cloudHavenIcon mr-1" @click="gotoCloudHaven" v-bind="attrs" v-on="on"/>
        </template>
        <span>CloudHaven</span>
      </v-tooltip>
      <!--v-tooltip v-if="$route.name!='home' && $route.name!='login'" bottom color="#2572d2" light>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" icon @click="goBack">
            <v-icon color="yellow accent-2">mdi-arrow-left</v-icon>
          </v-btn>
        </template>
        <span>Go back</span>
      </v-tooltip-->
      <v-toolbar-title :class="appDetails.appBarTextClass" @click="gotoCloudHaven" style="cursor:pointer">{{appTitle?appTitle:'CloudHaven'}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-alert class="mt-auto mb-auto" dense dark elevation="12" transition="slide-y-reverse-transition" dismissible v-model="showGlobalAlert" :type="globalAlert.type||'success'">{{globalAlert.msg}}</v-alert>
      <v-spacer></v-spacer>
      <v-btn v-if="isLoggedIn && user.status=='Active'" class="mr-2" color="black" fab small dark @click="gotoCalendar"><v-icon>mdi-calendar-month-outline</v-icon></v-btn>
      <v-btn v-if="isLoggedIn && user.status=='Active'" class="mr-2" color="black" fab small dark @click="gotoTasks"><v-icon>mdi-tray-full</v-icon></v-btn>
      <v-btn v-if="isLoggedIn && user.status=='Active'" class="mr-2" color="black" fab small dark @click="gotoMail"><v-icon>mdi-email-multiple-outline</v-icon></v-btn>
      <span v-if="isLoggedIn" :class="appDetails.nameTextClass">{{user.name}}&nbsp;&nbsp;&nbsp;&nbsp;<a :class="appDetails.appBarTextClass" @click="logout"><b>Logout</b></a></span>
      <!--v-spacer></v-spacer>
      <v-btn icon @click.stop="rightDrawer = !rightDrawer">
        <v-icon color="yellow accent-2">mdi-menu</v-icon>
      </v-btn-->
    </v-app-bar>
    <v-main>
      <router-view/>
    </v-main>
    <v-dialog v-model="termsDialog" @keydown.esc.prevent="termsDialog = false" max-width="100%" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title><span>Terms &amp; Conditions</span><v-spacer/><v-btn icon @click="termsDialog=false"><v-icon>mdi-close-thick</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <TermsAndConditions />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="supportDialog" @keydown.esc.prevent="supportDialog = false" max-width="100%" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title><span>Contact Us/Support</span></v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="contactForm" width="500px" lazy-validation>
            <div><p>Feel free to contact us with support questions, feature suggestions, other issues or comments.</p></div>
            <v-textarea v-model="contactFormContent" label="Message" rows="8" auto-grow :rules="[rules.required]">
            </v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native="supportDialog=false">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native="sendMessage"><v-icon left dark>mdi-send</v-icon>Send</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-footer :fixed="fixed" app :style="{background: 'linear-gradient(to top, #FFFFFF -100%, #00528d 100%)'}">
      <span class="white--text">&copy; CloudHaven @ 2020-2021 &nbsp;&nbsp;(v0.092)</span>
      <v-spacer/>
      <a class="white--text mr-4" @click.stop="termsDialog=true" href="#">Terms and Conditions</a>
      <a class="white--text" href="https://www.termsfeed.com/live/a38a2f80-8fae-4f14-ba5a-5879e55f29fa">Privacy Policy</a>
      <v-spacer/>
      <a class="white--text mr-4" @click.stop="supportDialog=true" href="#">Support/Contact Us</a>
    </v-footer>

  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from './event-bus.js';
import Api from '@/services/Api'
import router from './router'
import TermsAndConditions from './components/TermsAndConditions.vue'
const CloudHavenAppDetails = {
  name: 'CloudHaven',
  appBarStyle: {background: 'linear-gradient(to bottom, #FFFFFF -100%, #00528d 100%)'},
  appBarTextClass: "white--text text--accent-2",
  nameTextClass: "yellow--text",
  sysAdminMenuItems: [
    { route: 'MyApps', action: '', title: 'My Apps' },
    { route: 'AppStore', action: '', title: 'App Store' },
    { route: 'MyProfile', action: '', title: 'My Profile'},
    { route: 'organizations', action: '', title: 'Organizations' },
    { route: 'users', action: '', title: 'Users' },
    { route: 'userFiles', action: '', title: 'User Files' },
    { route: 'ViewUserData', action: '', title: 'View User Data' },
    { route: 'VCDNEditorTester', action: '', title: 'VCDN Editor Tester' }
  ],
  userMenuItems: [
    { route: 'Welcome', action: '', title: 'Welcome'},
    { route: 'MyApps', action: '', title: 'My Apps' },
    { route: 'AppStore', action: '', title: 'App Store' },
    { route: 'MyProfile', action: '', title: 'My Profile'},
    { route: 'organizations', action: '', title: 'Develop'}
  ]
};
export default {
  name: 'App',
  components: {TermsAndConditions},
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
      pwdDialog: false,
      pwdValid: true,
      chgPwdObj: {},
      confPwdErrMsg:'',
      rules:{
          required: value => !!value || 'Required.'
      },
      appDetails: {
        appBarStyle: '',
        appBarTextClass: '',
        nameTextClass: '',
        organizationId: '',
        appId: '',
        name: '',
        menuItems: []
      },
      termsDialog: false,
      supportDialog: false,
      contactFormContent:''
    }
  },
  created() {
    EventBus.$on('errors:401', () => {
      if (this.$router.currentRoute.name != 'login') {
        this.$router.push('/login');
      }
    })
  },
  watch:{
    $route () {
        this.leftDrawer = false;
    },
    pwdDialog (val) {
      if (!val) {
        this.closePwdDlg()
      }
    },
    supportDialog( val ) {
      if (val) {
        this.contactFormContent = '';
      }
    }
  },
  beforeCreate() {
    this.$store.commit('reload_user', ()=>{
      this.$store.dispatch('reloadUser')
      .then (user=>{
        if (user.status == 'Email Verification Pending') {
          this.$router.push({ name: 'NeedEmailConf' })        
        } else if (user.status == 'Need Organization Assignment') {
          this.$router.push('/createorassignorg');
        }
      })
    })
  },
  mounted() {
    this.contactFormContent = '';
    var vm = this;
    EventBus.$on('set app frame', (appDetails) => {
      vm.appDetails = Object.assign({}, appDetails?appDetails:CloudHavenAppDetails)
    })
    EventBus.$on('global success alert', (msg) => {
      vm.showAlert( msg, false);
    })
    EventBus.$on('global error alert', (msg) => {
      vm.showAlert(msg, true);
    })
    vm.appDetails = Object.assign({}, CloudHavenAppDetails);
    this.goHome();
  },
  computed: {
    showHomeIcon() {
      return true; //this.$route.name=='OrganizationAppPane' && this.user.status=='Active'
    },
    appTitle() {
      return this.appDetails.name==CloudHavenAppDetails.name?'': ` ${this.appDetails.name}`
    },
    isLoggedIn : function(){ return this.$store.getters.isLoggedIn},
    ...mapState([ 'user' ]),
    menuItems() {
      if (this.appDetails.name == CloudHavenAppDetails.name || !this.appDetails.menuItems) {
        return this.user.roles.find(r=>(r=='SYSADMIN'))?CloudHavenAppDetails.sysAdminMenuItems:CloudHavenAppDetails.userMenuItems;
      }
      var menuItems = [];
      this.appDetails.menuItems.forEach(m=>{
        menuItems.push({ name: 'AppPageReset', params: { app:_.omit(this.appDetails,['logo']), page:m.page }, title: m.title })
      })
      return menuItems;
    }
  },
  methods: {
    sendMessage() {
      if (!this.$refs.contactForm.validate()) return;
      (async () => {
        var postData = {email: this.user.email, message: this.contactFormContent};
        var response = await Api().post('/usersubscription/supportmessage', postData);
        if (response.data.success) {
          EventBus.$emit('global success alert', `Message sent to support@cloudhaven.net`);
        } else if (response.data.errMsg) {
          EventBus.$emit('global success alert', `Failed to send message (${response.data.errMsg}).`);
        }
        this.supportDialog = false;
      })();

    },
    showAlert( msg, isError) {
      this.globalAlert.type = isError?'error':'success';
      this.globalAlert.msg = msg;
      this.showGlobalAlert = true;
      if (!this.errorDisplayed != msg) {
        setTimeout(() => {
          this.showGlobalAlert = false;
          this.errorDisplayed = ''
        }, 10000)
        this.errorDisplayed = msg;
      }
    },
    gotoCalendar() {
      this.$router.push('/calendar');
    },
    gotoTasks() {
      this.$router.push('/tasks');
    },
    gotoMail() {
      this.$router.push('/mail');
    },
    goHome() {
      if (this.isOrganization) {
        if (this.$router.currentRoute.name != 'organizationCalendar') {
          this.$router.push('/organizationcalendar');
        }
      } else {
        if (this.appDetails.name == CloudHavenAppDetails.name) {
          if (this.$router.currentRoute.name != 'home') {
            this.$router.push('/home');
          }
        } else {
          this.$router.push({ name: 'AppPageReset', params: { app:this.appDetails, page:'home' } })
        }
      }
      this.leftDrawer = false;
    },
    goBack() {
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
          EventBus.$emit('global success alert', `Password changed.`)
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
        window.location="/";
//        this.appDetails = Object.assign({}, CloudHavenAppDetails);
//        this.$router.push('/login');
      })
    },
    gotoCloudHaven() {
      this.appDetails = Object.assign({}, CloudHavenAppDetails);
      router.push({name:"home"});
    },
    gotoItem (item ) {
      if (item.route) {
        if (item.route == this.$router.currentRoute.name) {
          EventBus.$emit(`${item.route} data refresh`);
        } else if (item.route) {
          router.push({name:item.route}); //, params: item.params
        }
      } else if (item.name) {
        router.push({name:item.name, params:item.params})
      } else {
        (item.action)();
      }
    }
  }
}
</script>
<style>
  .cloudHavenIcon {
    width:30px;
    height:30px;
    background:
      url(data:image/png;base64,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)
      no-repeat
      left center;
    -webkit-background-size: contain;
    -moz-background-size: contain;
    -o-background-size: contain;
    background-size: contain;
    padding: 0
  }
</style>
