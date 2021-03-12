<template>
<div id="appDiv">
  <component :is="component" :dataModel="dataModel" :uiMethods="uiMethods" :uiSchema="uiSchema" :app="app"></component>
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
      dataModel:{},
      uiMethods: {},
      uiSchema: {}
    }
  },
  mounted() {
    var userId = this.$route.params.userId;
    this.app = this.$route.params.app;
    if (!this.app) return;
    (async () => {
      var response = await Api().get(this.app.url);
      var uiConfig = response.data;
      this.dataModel= uiConfig.dataModel;
      this.uiMethods= uiConfig.uiMethods;
      this.uiSchema= uiConfig.uiSchema
      this.component = 'DynamicUI';
    })();
  }
}
</script>
