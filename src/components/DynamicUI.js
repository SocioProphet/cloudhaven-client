import Vue from 'vue';
import * as VueLib from 'vuetify/lib';
import _ from 'lodash'
import vuetify from '@/plugins/vuetify'

const uiElementToVueCompMap = {
  div: 'div',
  row: 'VRow',
  col: 'VCol',
  button: 'VBtn',
  spacer: 'VSpacer',
  card: 'VCard',
  cardTitle: 'VCardTitle',
  cardBody: 'VCardText',
  cardActions: 'VCardActions',
  container: 'VContainer',
  dataTable: 'VDataTable',
  form: 'VForm',
  textField: 'VTextField',
  icon: 'VIcon'
}
function makeComponent( h, metaData, rootThis ) {
  var isArray = Array.isArray(metaData);
  if (isArray) {
    throw "Array is not allowed metaData";
    return;
  }
  var component = metaData.component;
  var vueComponent = uiElementToVueCompMap[component];
  var dataObj = ['class', 'style', 'attrs', 'props', 'domProps', 'on', 'nativeOn', 'key', 'ref'].reduce((o,k)=>{
    if (k in metaData) {
      o[k] = metaData[k];
    }
    return o;
  },{});
/*  if (metaData.scopedSlots) {
    var keys = Object.keys(metaData.scopedSlots);
    var scopedSlots = {};
     keys.forEach((k) => {
      var slotMetaData = metaData.scopedSlots[k];
      scopedSlots[k] = (props) => makeComponent( h, slotMetaData, rootThis );
    })
    dataObj.scopedSlots = scopedSlots
  }*/
  var vcomp = VueLib[vueComponent];
  var children = null;
  if (metaData.contents) {
    if (_.isString( metaData.contents)) {
      children = metaData.contents;
    } else if (Array.isArray( metaData.contents )) {
      children = metaData.contents.map((el)=>{ return makeComponent( h, el, rootThis ); })
    } else {
      children = [makeComponent( h, metaData.contents, rootThis )]
    }
  } else if (metaData.template) {
    const compiledTemplate = Vue.compile(metaData.template);
    children = [compiledTemplate.render.call(rootThis, h)]
  }
  var hhh = h( vcomp, dataObj, children);
  return hhh;
}

const DynamicUI = Vue.component('DynamicUI', {
  props: {
    uiSchema: { type: Object, required: true },
    dataModel: { type: Object, required: true },
    uiMethods: { type: Object, required: true }
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    var outerThis = this;
    new Vue({
      el: '#dynamicUIDiv',
      data() {
        return outerThis.dataModel;
      },
      vuetify,
      methods: this.uiMethods,
      render(h) {
        return makeComponent( h, outerThis.uiSchema, this );
      },
      mounted() {
        this.getTableData();
      }
    })

  }
});

export default DynamicUI;