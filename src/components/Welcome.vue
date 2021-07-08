<template>
 <div>
   <v-container>
  <v-card dark>
    <v-card-title>
      <span class="text-h5 yellow--text">Welcome {{user.name}}</span><v-spacer/>
        <div class="cloudHavenIcon" />

    </v-card-title>
    <v-card-text class="px-4 text-body-1">
<p>Use CloudHaven to quickly create prototypes of Vue/Vuetify-based applications via Vue dynamically rendered 
  from 100% JSON structures. Dynamic rendering not only enables fast development, it also makes it possible
  to create applications that are composites of components from multiple organizations. All done dynamically
  without compiling, webpack, etc.</p>
<p>CloudHaven is more than a component library or framework - every application or component has its own “backend”
   which can be hosted locally in CloudHaven or at your own remote application server.</p>
<p>Applications can be instantly published and available from the App Store to any CloudHaven user.</p>
<p>Templates are available for quick starts.</p>
<p>Applications and components are tightly integrated with:</p>
<div class="ml-4">
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoMail"><v-icon>mdi-email-multiple-outline</v-icon></v-btn>
  Internal messaging system (applications work inside messages)
</v-row>
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoTasks"><v-icon>mdi-tray-full</v-icon></v-btn>
  First-come-first-serve workflow task queues (applications work inside tasks)
</v-row>
<v-row class="align-center">
  <v-btn color="black" fab small dark @click="gotoCalendar"><v-icon>mdi-calendar-month-outline</v-icon></v-btn>
  Calendar (applications work inside events)
</v-row>
<div class="mt-2 text-body-2">(located in the upper right on the app bar)</div>
</div>

<br/>

<p class="yellow--text">To begin developing, select “Develop” from the hamburger menu in the upper left and click “New Application”
   in the Application tab. Applications are made of pages so next create a page and name it “home”.
  Note that you can select from a number of pre-built templates (center top of page form) for quick starts.</p>

  <p>Learn more about CloudHaven at <a target="_blank" href="https://www.cloudhaven.net">wwww.cloudhaven.net</a></p>
  <p>Also, be sure to read the <a target="_blank" href="https://cloudhaven.net/ui-api-programmers-guide/">UI API Programmers Guide</a></p>
    </v-card-text>
  </v-card>
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
