<template>
<div>
  <v-container class="justify-center">
    <v-row class="d-flex text-center justify-center wrap" >
        <v-card height="650px" style="background: linear-gradient(to bottom, #FFFFFF -10%, #00528d 100%);" class="pt-9 justify-space-around">
          <div class="pa-6"><v-img class="ml-auto mr-auto" max-width="340px" :src="logoDataURI" /></div>
          <div>
            <span class='text-h3'><b>CloudHaven</b></span>
          </div>
        </v-card>
        <div style="width:380px">
        <v-card height="650px" :style="{'background-color':'#00b397'}" class="pa-2 d-flex align-center">
          <v-card-text>
          <v-sheet v-if="loginToContinueRegistation" class="d-flex justify-center align-center mt-auto mb-2 mx-2">
            <div class="my-5 px-2" >
              Please login to continue registration.
            </div>
            
          </v-sheet>
          <v-tabs v-if="!waitingForVerificationEmail" v-model="tab" background-color="#00528d" show-arrows icons-and-text dark grow class="mx-2" style="width:95%">
            <v-tabs-slider color="#00528d"></v-tabs-slider>
              <v-tab v-for="(i,index) in tabs" :key="index">
                  <v-icon large>{{ i.icon }}</v-icon>
                  <div class="py-1">{{ i.name }}</div>
              </v-tab>
              <v-tab-item>
                <v-card flat >
            <!--v-card-title primary-title>
              <h4>Login</h4>
            </v-card-title-->
            <v-card-text class="mt-auto mb-auto">
            <v-form ref="loginForm" v-model="loginValid" lazy-validation>
            <v-text-field @keydown="clearLoginAlert" prepend-icon="mdi-account" v-model="loginEmail" name="email" label="Email" :rules="[rules.required]" ></v-text-field>
            <v-text-field @keydown="clearLoginAlert" prepend-icon="mdi-lock" v-model="loginPassword" name="Password" label="Password"
              type="password" :rules="[rules.required]" ></v-text-field>
            <v-card-actions>
              <v-btn elevation="2" color="#00528d" primary large dark block @click="login" >Login</v-btn>
            </v-card-actions>
            </v-form>
            <a @click.prevent="forgotPwd" href="#">Forgot Password?</a>
            <v-alert class="mt-2" dense :value="loginAlertMsg?true:false" :type="loginAlertType">{{loginAlertMsg}}</v-alert>
            </v-card-text>
          </v-card>
              </v-tab-item>
            <v-tab-item>
              <v-card class="px-1">
                <v-card-text>
                    <v-form ref="registerForm" v-model="registerValid" lazy-validation>
                      <v-row>
                        <v-col>
                      <v-text-field v-model="firstName" :rules="[rules.required]" label="First Name" maxlength="20" required></v-text-field>
                      </v-col>
                      <v-col>
                      <v-text-field v-model="lastName" :rules="[rules.required]" label="Last Name" maxlength="20" required></v-text-field>
                      </v-col>
                      </v-row>
                      <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
                      <v-text-field v-model="password" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, rules.min]" :type="show1 ? 'text' : 'password'" 
                        name="input-10-1" label="Password" hint="At least 8 characters" counter @click:append="show1 = !show1"></v-text-field>
                      <v-text-field block v-model="verify" :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" :rules="[rules.required, passwordMatch]" :type="show1 ? 'text' : 'password'" 
                        name="input-10-1" label="Confirm Password" counter @click:append="show1 = !show1"></v-text-field>
                      <v-btn primary large dark  color="#00528d" class="mt-2" @click="register">Register</v-btn>
                      <v-alert dense :value="registerErrMsg?true:false" type="error">{{registerErrMsg}}</v-alert>
                    </v-form>
                </v-card-text>
            </v-card>              
            </v-tab-item>
          </v-tabs>
          <v-sheet v-if="waitingForVerificationEmail" class="d-flex justify-center align-center mt-auto mb-auto mb-2">
            <div class="my-5 px-2" >
              A verification email has been sent to you. To complete registration, find the email with subject "CloudHaven account email verification" and click on the link inside.<br/><br/>
              This verification email expires after 10 minutes.<br/>
            
            <v-btn primary large dark  color="#00528d" class="mt-5 mx-2" @click="resendVerificationEmail">Resend verification email</v-btn>
            </div>
            
          </v-sheet>
        </v-card-text>
        </v-card>
        </div>
    </v-row>
  </v-container>
</div>
</template>

<script>
  import Api from '@/services/Api'
  import { EventBus } from '../event-bus.js';
  import logoDataURI from '../includes/logoDataURI.js';
  export default {
    mounted() {
      this.waitingForVerificationEmail = false;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("fromemailverify")=='true') {
        this.loginToContinueRegistation = true;
      }
    },
    computed: {
      passwordMatch() {
        return () => this.password === this.verify || "Password must match";
      }
    },
    methods: {
      waitForEmailVerification() {
        this.$router.push({name:'NeedEmailConf'})
      },
      resendVerificationEmail() {
        (async () => {
          var response = await Api().get('/resendverificationemail/'+(this.loginEmail||this.email));
          if (response.data.success) {
            this.waitForEmailVerification();
          }
        })();
      },
      register() {
        if (this.$refs.registerForm.validate()) {
          (async () => {
            var user = {
              email:this.email,
              firstName: this.firstName,
              lastName: this.lastName,
              password: this.password
            }
            var response = await Api().post('/signup', user);
            if (response.data.success) {
              this.waitingForVerificationEmail = true;
              this.tab=0;
            } else if (response.data.errMsg) {
              this.registerErrMsg = response.data.errMsg;
            }
          })();
        }
      },
      clearLoginAlert() {
        this.loginAlertMsg = '';
      },
      forgotPwd() {
        if (!this.loginEmail) {
          this.loginAlertType = 'error';
          this.loginAlertMsg = "Please enter an email address to receive a password reset link."
        } else {
          (async () => {
            var response = await Api().get('/sendpwdresetemail/'+(this.loginEmail||this.email));
            if (response.data.success) {
              this.loginAlertType = 'success';
              this.loginAlertMsg = 'Password reset email sent.';
            }
          })();
        }
      },
      login() {
        if (this.$refs.loginForm.validate()) {
          let email = this.loginEmail;
          let password = this.loginPassword;
          this.$store.dispatch('login', { email, password })
          .then((user) => {
            if (user.status == 'Email Verification Pending') {
              this.waitForEmailVerification();
            } else if (user.status == 'Need Organization Assignment') {
              this.$router.push('/createorassignorg');
            } else {
              this.$store.dispatch('reloadUser')
              .then(()=>{
                this.goHome(user);
              })
            }
          })
          .catch((error) => {

            this.loginAlertType = 'error';
            this.loginAlertMsg = 'Login failed. '+error;
          })
        }
      },
      goHome(user) {
        EventBus.$emit('set app frame'); //Reset to CloudHaven appFrame
        this.$router.push({name:'home'});
      }
    },
    data(){
      return {
        waitingForVerificationEmail: false,
        loginToContinueRegistation: false,
        registerValid: true,
        loginValid: true,
        tab: 0,
        tabs: [
          {name: "Login", icon:"mdi-account"},
          {name:"Register", icon:"mdi-account-outline"}
        ],
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        verify: "",
        registerErrMsg: '',
        loginAlertMsg:'',
        loginEmail : "",
        loginPassword : "",
        loginEmailRules: [
          v => !!v || "Required",
          v => /.+@.+\..+/.test(v) || "E-mail must be valid"
        ],
        loginAlertType: 'error',
        emailRules: [
          v => !!v || "Required",
          v => /.+@.+\..+/.test(v) || "E-mail must be valid"
        ],
        show1: false,
        rules: {
          required: value => !!value || "Required.",
          min: v => (v && v.length >= 8) || "Min 8 characters"
        },
        logoDataURI: logoDataURI
      }
    }
  }
</script>