<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-title>MyApps</v-toolbar-title>
    </v-toolbar>
    <v-layout>
      <v-row no-gutters>
          <v-card class="pa-2 ma-2" elevation="4" v-for="app in applications" :key="app.key" @click="launchApp(app)">
            <v-card-title>{{app.name}}</v-card-title>
            <v-card-subtitle>{{app.organization.name}}</v-card-subtitle>
            <v-card-text>
              <v-img width="150px" :src="app.logoSrc"></v-img>
            </v-card-text>
            <v-card-actions>
              <v-btn text color="red darken-2" @click.stop="unsubscribe(app)" >
                Unsubscribe
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
import router from '../router'
  export default {
    components: {
    },
    data: () => ({
      dialog: false,
      valid: true,
      rawSubscriptions: []

    }),

    computed: {
      emptyLogo() {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      },
      applications() {
        return this.rawSubscriptions.map((a)=>{
          a.key = a.organization.name+':'+a.name;
          a.organizationId = a.organization._id;
          if (a.logo) {
//            var bytes = new Uint8Array(a.logo.data);
//            var binary = bytes.reduce((data, b) => data += String.fromCharCode(b), '');
//            a.logoSrc = "data:image/jpeg;base64," + btoa(binary);
            a.logoSrc = "data:image/jpeg;base64," + a.logo;
          } else {
            a.logoSrc = this.emptyLogo;
          }
          return a;
        });
      },
      ...mapState(['user'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      this.loadMyApps();
      EventBus.$on('organizations data refresh', () =>{
        this.loadMyApps()
      })
    },

    methods: {
      launchApp(app) {
        router.push({ name: 'OrganizationAppPane', params: { app:app, page:'home' } })
      },
      loadMyApps() {
        (async () => {
            var response = await Api().get('/usersubscription/'+this.user._id);
            if (!response.data) return;
            if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg);
            } else {
              this.rawSubscriptions = response.data.subscribedApps;
            }
        })();
      },
      unsubscribe(app) {
        (async () => {
          var response = await Api().delete(`/usersubscription/${this.user._id}/${app.organizationId}/${app._id}`);
          if (response.data.success) {
            EventBus.$emit('global success alert', `Unsubscribed to ${app.name}.`);
            this.loadMyApps();
          } else if (response.data.errMsg) {
            EventBus.$emit('global success alert', `Failed to unsubscribed to ${app.name} (${errMsg}).`);
          }
        })();

      }
    }
  }
</script>

<style scoped>
</style>
