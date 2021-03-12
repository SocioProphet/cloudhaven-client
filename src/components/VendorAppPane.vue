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
      /*
      var dataObj = {attrs: {
        dataModel: uiConfig.dataModel,
        uiMethods: uiConfig.uiMethods,
        uiSchema: uiConfig.uiSchema,
        app: this.app
      }}*/
//      var c = new DynamicUI(dataObj);
//      c.$mount('#appDiv');
/*      new Vue({
        el: '#appDiv',
        store: this.$store,
        render(h) {
          return h( 'DynamicUI', dataObj );
        },
      })*/
    })();
  }
}
</script>
