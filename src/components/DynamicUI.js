import Vue from 'vue';
import * as VueLib from 'vuetify/lib';
import _ from 'lodash'
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
function makeComponent( h, metaData ) {
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
  var vcomp = VueLib[vueComponent];
  debugger;
  var hhh = h( vcomp, dataObj, metaData.contents? (
    _.isString( metaData.contents) ? metaData.contents : (
      Array.isArray( metaData.contents ) ?
      metaData.contents.map((el)=>{
        return makeComponent( h, el );
      }) :
      [makeComponent( h, metaData.contents )]
    )
    ):null
  )
  debugger;
  return hhh;
}
const DynamicUI = Vue.component('DynamicUI', {
  props: {
    metaData: { type: Object, required: true}
  },
  render(h){
    var xxx = makeComponent( h, this.metaData );
    debugger;
    return xxx;
  }
});

export default DynamicUI;