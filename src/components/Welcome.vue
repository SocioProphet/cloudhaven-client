<template>
 <div>
   <v-container>
  <v-card color="#ffebd5">
    <v-card-title>
      <span class="text-h5 chHeading">Welcome {{user.name}}</span><v-spacer/>
        <div class="cloudHavenIcon" />

    </v-card-title>
    <v-card-text class="px-4 text-body-1">
<p>CloudHaven is a <b>FREE</b> platform that enables anyone to quickly create Vue prototypes:</p>
<ul>
  <li>Vue-based UIs are dynamically rendered</li>
  <li>Include components from any organization</li>
  <li>Apps and components each have their own "back-end"<br/>
      (Use your own servers or simple CloudHaven db+)</li>
  <li>Seamless, consistent user-interface</li>
  <li>Open to anyone/any organization</li>
  <li>100% Free</li>
  </ul>
<p>
<p>Applications can be instantly published to the CloudHaven App Store where they are available for free subscription by any CloudHaven user.</p>
<p>Templates are available for quick starts.</p>
<p>Applications and components are tightly integrated with:</p>
<div class="ml-4">
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoMail" class="mr-3"><v-icon>mdi-email-multiple-outline</v-icon></v-btn>
  <span class="black--text text--darken-4"><b>Internal messaging system (applications work inside messages)</b></span>
</v-row>
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoTasks" class="mr-3"><v-icon>mdi-tray-full</v-icon></v-btn>
  <span class="black--text text--darken-4"><b>First-come-first-serve workflow task queues (applications work inside tasks)</b></span>
</v-row>
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoCalendar" class="mr-3"><v-icon>mdi-calendar-month-outline</v-icon></v-btn>
  <span class="black--text text--darken-4"><b>Calendar (applications work inside events)</b></span>
</v-row>
<br/>
</div>
<span class="ml-0 mt-5 text-body-2 grey--text text--darken-4">(located in the upper right on the app bar)</span>
<br/>

<br>

<p style="color:#008671"><b>To begin developing, select “Develop” from the hamburger menu in the upper left and click “New Application”
   in the Application tab. Applications are made of pages so next create a page and name it “home”.
  Note that you can select from a number of pre-built templates (center top of page form) for quick starts.</b></p>

  <p>Learn more about CloudHaven at <a target="_blank" href="https://www.cloudhaven.net">wwww.cloudhaven.net</a></p>
  <p>Also, be sure to read the <a target="_blank" href="https://cloudhaven.net/ui-api-programmers-guide/">UI API Programmers Guide</a></p>

    <h3>Tutorial Videos</h3>
    <ul>
      <li><a target="_blank" href="https://youtu.be/ARk_1m-SLmw">Quick Start</a></li>
    </ul>
    </v-card-text>
  </v-card>
  <div style="text-align:center" class="chHeading mx-8 mt-2" ><b>** NOTE ** CLOUDHAVEN WILL SOON GO BEYOND PROTOTYPING AND BECOME A HARDENED PLATFORM FOR QUICKLY BUILDING CROSS-ORGANIZATION, COLLABORATIVE APPLICATIONS BUILT IN A HIGHLY COLLABORATIVE AND DYNAMIC MANNER.</b></div>

   </v-container>
 </div>
</template>

<script>
import { mapState } from 'vuex'
  export default {
    data: () => ({
    }),

    computed: {
      ...mapState(['user'])
    },
    methods: {
    gotoCalendar() {
      this.$router.push('/calendar');
    },
    gotoTasks() {
      this.$router.push('/tasks');
    },
    gotoMail() {
      this.$router.push('/mail');
    },
  }
  }
</script>

<style scoped>
ul li {
  color:#000000;
  font-weight: bold;
}
p {
  color: #212121
}
.chHeading {
  color: #003d69
}
</style>