<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-title>App Store</v-toolbar-title>
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
                @click="subscribe(app)"
              >
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
      valid: true

    }),

    computed: {
      emptyLogo() {
        return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      },
      applications() {
        if (!this.vendors) return [];
        return this.vendors.reduce((ar, v)=>{
          ar = ar.concat(v.applications.map((a)=>{
            a.key = v.name+':'+a.name;
            a.vendorId = v._id;
            if (a.logo) {
              var bytes = new Uint8Array(a.logo.data);
              var binary = bytes.reduce((data, b) => data += String.fromCharCode(b), '');
              a.logoSrc = "data:image/jpeg;base64," + btoa(binary);
            } else {
              a.logoSrc = this.emptyLogo;
            }
            return a;
          })||[]);
          return ar;
        },[]);
      },
      ...mapState(['vendors', 'user'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.$store.commit('SET_CRUDAPISERVCE', 'vendors');
      this.$store.dispatch('loadRecords', 'vendors');
      EventBus.$on('vendors data refresh', () =>{
        this.$store.dispatch('loadRecords', 'vendors');
      })
    },

    methods: {
      subscribe(app) {
        var u = this.user;
        (async () => {
          var postData = {userId: this.user._id, vendorId: app.vendorId, applicationId: app._id};
          var response = await Api().post('/usersubscription', postData);
          var x = response.data;
          this.$store.commit('SET_CRUDAPISERVCE', 'vendors');
        })();

      }
    }
  }
</script>

<style scoped>
</style>
