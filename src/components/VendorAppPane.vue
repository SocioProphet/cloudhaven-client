<template>
<div id="appDiv">
  <component :is="component" :uiConfig="uiConfig" :app="app"></component>
</div>
</template>

<script>
import DynamicUI from './DynamicUI.js'
import Api from '@/services/Api'
import { VSheet } from 'vuetify/lib'

export default {
  components: {
    DynamicUI, VSheet
  },
  data() {
    return {
      component: 'VSheet',
      app: null,
      uiConfig:{}
    }
  },
  mounted() {
    var userId = this.$route.params.userId;
    this.app = this.$route.params.app;
    if (!this.app) return;
    var app = {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id};
    (async () => {
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:'initUIConfig'});
      this.uiConfig = response.data;
      //{requiredUserData, dataModel, uiMethods, uiSchema}
      this.component = 'DynamicUI';
    })();
  }
}
</script>
