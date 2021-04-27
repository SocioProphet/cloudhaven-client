<template>
<div id="appDiv">
  <component :is="component" :uiConfig="uiConfig" :app="app"></component>
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
      app: {},
      uiConfig:{components:[]},
    }
  },
  mounted() {
    var app = this.$route.params.app;
    if (!app) return;
    var pApp = {url:app.url, vendorId: app.vendorId, _id: app._id, applicationId:app.applicationId};
    var page = this.$route.params.page || 'home';
    pApp.page = page;
    this.app = Object.assign({}, pApp);
    (async () => {
      var response = await Api().post('/vendorapplication/getapppage', {app:pApp, page:page});
      this.uiConfig = response.data;
      if (this.uiConfig.appFrame) {
        EventBus.$emit('set app frame', Object.assign(this.app, this.uiConfig.appFrame))
      }
      var u = this.uiConfig;
      if (this.uiConfig.externalComponents) {
        var response = await Api().post('/vendorcomponent/getcomponents', {vendorComps:this.uiConfig.externalComponents});
        if (response.status==200 && response.data.success) {
          this.uiConfig.components = (this.uiConfig.components || []).concat(response.data.components);
        }
        this.component = 'DynamicUI';
      } else {
        this.component = 'DynamicUI';
      }
    })();
  }
}
</script>
