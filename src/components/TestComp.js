import Vue from 'vue';

export default Vue.component('TestComp', {
  props: {
    metaData: { type: Object, required: true },
//    d: { type: Object, required: true }
  },
  template: `<div id="testDiv"></div>`,
  mounted() {
    var outerThis = this;
    new Vue({
      el: '#testDiv',
      data() {
        return outerThis.metaData;
      },
      template: `<h1>{{displayThis}}</h1>`
/*      render(h) {
        return h('h1', 'Hello World');
      }*/
    })
  }
})