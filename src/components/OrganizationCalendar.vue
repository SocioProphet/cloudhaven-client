<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Calendar</span>
    </v-card-title>

    <v-card-text>
    </v-card-text>

    <!--v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click="cancelForm()">Go back</v-btn>
    </v-card-actions-->
  </v-card>
    
</template>

<script>
import router from '../router'
  export default {
    components: {
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