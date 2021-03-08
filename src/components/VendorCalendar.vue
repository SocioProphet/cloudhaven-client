<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Calendar</span>
    </v-card-title>

    <v-card-text>
      <EventCalendar :vendorId="'5c17d7900da1c45d104d0eef'"></EventCalendar>
    </v-card-text>

    <!--v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click="cancelForm()">Go back</v-btn>
    </v-card-actions-->
  </v-card>
    
</template>

<script>
import router from '../router'
import EventCalendar from './EventCalendar.vue'
  export default {
    components: {
      EventCalendar
    },
    data: () => ({
      error: ''
    }),

    computed: {
    },

    methods: {
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>