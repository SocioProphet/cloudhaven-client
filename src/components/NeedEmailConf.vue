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
        <v-card height="650px" :style="{'background-color':'#00b397'}" class="pa-3 d-flex justify-space-around">
          <v-sheet max-width="90%" class="justify-center align-center mt-auto mb-auto">
            <v-spacer/>
            <div class="my-5 px-1" >
              <div v-if="!verifyExpired">An email with subject "CloudHaven account email verification" was sent to you. 
              Please click on the link inside to verify your email and continue registration.<br/><br/>
              Note that this verification email expires after 10 minutes.<br/>(click the button below for a fresh one)
            </div>
            <div v-else-if="verifyExpired">
              Your verification email has expired<br/>(expires after 10 minutes).<br/><br/>Please click the "Resend Verification email" button below for a new verification email.
            </div>
            <v-btn primary large dark  color="#00528d" class="mt-5 mx-2" @click="resendVerificationEmail">Resend verification email</v-btn>
            </div>
            <v-spacer/>
            
          </v-sheet>
        </v-card>
        </div>
    </v-row>
  </v-container>
</div>
</template>

<script>
  import Api from '@/services/Api';
  import { EventBus } from '../event-bus.js';
  import { mapState } from 'vuex';
  import logoDataURI from '../includes/logoDataURI.js';
  export default {
    computed: {
      ...mapState(['user'])
    },
    methods: {
      resendVerificationEmail() {
        (async () => {
          var response = await Api().get('/resendverificationemail/'+(this.user.email));
          if (response.data.success) {
            this.verifyExpired = false;
            EventBus.$emit('global success alert', 'Verification email resent.')            
          }
        })();
      }
    },
    data(){
      return {
        verifyExpired:true,
        rules: {
          required: value => !!value || "Required.",
          min: v => (v && v.length >= 8) || "Min 8 characters"
        },
        logoDataURI: logoDataURI
      }
    }
  }
</script>