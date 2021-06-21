<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-title>App Store</v-toolbar-title>
    </v-toolbar>
    <v-layout>
      <v-row no-gutters>
          <v-card class="pa-2 ma-2" elevation="4" v-for="app in applications" :key="app.key" >
            <v-card-title>{{app.name}}</v-card-title>
            <v-card-subtitle>{{app.organizationName}}</v-card-subtitle>
            <v-card-text>
              <v-img width="150px" :src="app.logoSrc"></v-img>
            </v-card-text>
            <v-card-actions>
              <v-btn text color="green darken-1" @click.stop="subscribe(app)" >
                Subscribe
              </v-btn>
            </v-card-actions>
        </v-card>
      </v-row>
    </v-layout>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
  export default {
    components: {
    },
    data: () => ({
      dialog: false,
      valid: true,
      applications: []
    }),

    computed: {
      emptyLogo() {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      },
      ...mapState([ 'user'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      (async () => {
        var response = await Api().get('/organizationapplication/applications');
        this.applications = (response.data || []).map((a)=>{
          if (a.logo) {
            var bytes = new Uint8Array(a.logo.data);
            var binary = bytes.reduce((data, b) => data += String.fromCharCode(b), '');
            a.logoSrc = "data:image/jpeg;base64," + btoa(binary);
          } else {
            a.logoSrc = this.emptyLogo;
          }
          return a;
        });
      })();
    },

    methods: {
      subscribe(app) {
        (async () => {
          var postData = {userId: this.user._id, organizationId: app.organizationId, applicationId: app._id};
          var response = await Api().post('/usersubscription', postData);
          if (response.data.success) {
            EventBus.$emit('global success alert', `Subscribed to ${app.name}.`);
          } else if (response.data.errMsg) {
            EventBus.$emit('global success alert', `Failed to subscribed to ${app.name} (${errMsg}).`);
          }
        })();

      }
    }
  }
</script>

<style scoped>
</style>
