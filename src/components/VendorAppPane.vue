<template>
<div id="appDiv">
  <component :is="component" :requiredUserData="requiredUserData" :dataModel="dataModel" :uiMethods="uiMethods" :uiSchema="uiSchema" :app="app"></component>
</div>
</template>

<script>
import DynamicUI from './DynamicUI.js'
import Api from '@/services/Api'
import Vue from 'vue'
import { VSheet } from 'vuetify/lib'

export default {
  components: {
    DynamicUI, VSheet
  },
  data() {
    return {
      component: 'VSheet',
      app: null,
      requiredUserData: {},
      dataModel:{},
      uiMethods: {},
      uiSchema: {}
    }
  },
  mounted() {
    var userId = this.$route.params.userId;
    this.app = this.$route.params.app;
    if (!this.app) return;
    var app = {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id};
    (async () => {
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:'initUIConfig'});
      var uiConfig = response.data;
      this.requiredUserData = uiConfig.requiredUserData;
      this.dataModel= uiConfig.dataModel;
      this.uiMethods= uiConfig.uiMethods;
      this.uiSchema= uiConfig.uiSchema
      this.component = 'DynamicUI';
    })();
  }
}
</script>
