<template>
<div id="appDiv">
</div>
</template>

<script>
import DynamicUI from './DynamicUI.js'
import Api from '@/services/Api'
import Vue from 'vue'

export default {
  components: {
    DynamicUI
  },
  data() {
    return {
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
      var dataObj = {attrs: {
        dataModel: uiConfig.dataModel,
        uiMethods: uiConfig.uiMethods,
        uiSchema: uiConfig.uiSchema,
        app: this.app
      }}
/*      var c = new DynamicUI(dataObj);
      c.$mount('#appDiv');*/
      new Vue({
        el: '#appDiv',
        store: this.$store,
        render(h) {
          return h( 'DynamicUI', dataObj );
        },
      })
    })();
  }
}
</script>
