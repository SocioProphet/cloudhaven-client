<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-title>MyApps</v-toolbar-title>
    </v-toolbar>
    <v-layout>
      <v-row no-gutters>
          <v-card class="pa-2 ma-2" elevation="4" v-for="app in applications" :key="app.key" >
            <v-card-title>{{app.name}}</v-card-title>
            <v-card-text>
              <v-img width="150px" :src="app.logoSrc"></v-img>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                color="teal accent-4"
                @click="unsubscribe(app)"
              >
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
          a.key = a.vendor.name+':'+a.name;
          a.vendorId = a.vendor._id;
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
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.loadMyApps();
      EventBus.$on('vendors data refresh', () =>{
        this.loadMyApps()
      })
    },

    methods: {
      loadMyApps() {
        (async () => {
            var response = await Api().get('/usersubscription/'+this.user._id);
            var x = response.data;
            if (!response.data) return;
            if (response.data.errMsg) {
              this.$store.commit('SET_ERRMSG', response.data.errMsg);
            } else {
              this.rawSubscriptions = response.data.subscribedApps;
            }
        })();
      },
      unsubscribe(app) {
        var u = this.user;
        (async () => {
          var response = await Api().delete(`/usersubscription/${this.user._id}/${app.vendorId}/${app._id}`);
          var x = response.data;
          this.loadMyApps();
        })();

      }
    }
  }
</script>

<style scoped>
</style>
