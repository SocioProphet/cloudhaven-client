<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-title>
        <div class="d-flex justify-space-between">
          <span style="width:200px">App Store</span>
          <div class="ml-6">
            <v-btn icon small class="pa-4" :outlined="viewMode=='grid'" @click="viewGrid"><v-icon>mdi-view-grid</v-icon></v-btn>
            <v-btn icon small class="pa-4" :outlined="viewMode=='list'" @click="viewList"><v-icon>mdi-view-list</v-icon></v-btn>
          </div>
          <v-text-field class="ml-6" style="max-width:400px" v-model="searchFilter" label="Search Filter" single-line dense />
        </div>
      </v-toolbar-title>
    </v-toolbar>
    <v-divider/>
    <v-layout class="mx-3 mt-3">
      <v-row v-if="viewMode=='grid'">
          <v-card color="grey lighten-5" class="pa-0 mx-2 mt-2" elevation="2" v-for="app in filteredApps" :key="app.key" >
            <v-card-title class="pt-1"><h5>{{app.name}}</h5></v-card-title>
            <v-card-subtitle class="pb-1">{{app.organization.name}}</v-card-subtitle>
            <v-card-text class="pa-0">
              <v-img class="mx-auto" width="100px" :src="app.logoSrc"></v-img>
            </v-card-text>
            <v-card-actions class="my-0 pt-1">
              <v-btn style="background-color:#00528d" class="mx-auto elevation-1" text color="white" @click.stop="subscribe(app)" >
                Subscribe
              </v-btn>
            </v-card-actions>
        </v-card>
      </v-row>
      <v-card v-else>
        <v-card-text>
          <v-data-table :items="filteredApps" :headers="headers">
            <template v-slot:item.logoSrc="{item}">
              <v-img width="20px" :src="item.logoSrc"></v-img>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-layout>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
import appPlaceHolderDataURI from '../includes/appPlaceHolderDataURI.js';
  export default {
    data: () => ({
      dialog: false,
      valid: true,
      applications: [],
      searchFilter:'',
      viewMode: 'grid',
      headers: [
        {text: '', value:"logoSrc"},
        {text: "Organization", align:'left', sortable:true, value:"organization.name"},
        {text: "Name", align:'left', sortable:true, value:"name"},
        {text: "ApplicationId", align:'left', sortable:true, value:"applicationId"},
      ]
    }),

    computed: {
      emptyLogo() {
        return appPlaceHolderDataURI;
      },
      filteredApps() {
        return this.searchFilter?this.applications.filter(app=>(app.name.indexOf(this.searchFilter)>=0 || app.applicationId.indexOf(this.searchFilter)>=0)):this.applications;
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
      viewGrid() {
        this.viewMode = 'grid';
      },
      viewList() {
        this.viewMode = 'list';
      },
      subscribe(app) {
        (async () => {
          var postData = {userId: this.user._id, organizationId: app.organization._id, applicationId: app._id};
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
