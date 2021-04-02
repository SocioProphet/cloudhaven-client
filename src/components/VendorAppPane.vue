<template>
<div id="appDiv">
  <component :is="component" :uiConfig="uiConfig" :app="app" :props="props"></component>
</div>
</template>

<script>
import DynamicUI from './DynamicUI.js'
import Api from '@/services/Api'
import { VSheet } from 'vuetify/lib'
import { EventBus } from '../event-bus.js';
import { deepGet, deepSet } from '../_helpers/deep.js'

export default {
  components: {
    DynamicUI, VSheet
  },
  data() {
    return {
      component: 'VSheet',
      app: null,
      uiConfig:{},
      props: {}
    }
  },
  mounted() {
    this.app = this.$route.params.app;
    var page = this.$route.params.page || 'home';
    this.props = Object.assign({},deepGet( this.$route, 'params.appParams')||{});
    if (!this.app) return;
    var pApp = {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id};
    (async () => {
      var response = await Api().post('/vendorapplication/apppost', {app:pApp, httpMethod: 'GET', postId:page});
      this.uiConfig = response.data;
      if (this.uiConfig.appFrame) {
        EventBus.$emit('set app frame', Object.assign(this.app, this.uiConfig.appFrame))
      }
      //{requiredUserData, dataModel, uiMethods, uiSchema}
      this.component = 'DynamicUI';
    })();
  }
}
</script>
