
/*

  ********************* Not currently used **********************

*/

import Vue from 'vue'
import * as VueLib from 'vuetify/lib'
import _ from 'lodash'
import vuetify from '@/plugins/vuetify'
import deep from 'deep-get-set'

const uiElementToVueCompMap = {
  row: VueLib['VRow'],
  col: VueLib['VCol'],
  button: VueLib['VBtn'],
  spacer: VueLib['VSpacer'],
  card: VueLib['VCard'],
  cardTitle: VueLib['VCardTitle'],
  cardBody: VueLib['VCardText'],
  cardActions: VueLib['VCardActions'],
  container: VueLib['VContainer'],
  staticTable: VueLib['VDataTable'],
  form: VueLib['VForm'],
  icon: VueLib['VIcon'],
  tab: VueLib['VTab'],
  tabs: VueLib['VTabs'],
  tabsItems: VueLib['VTabsItems'],
  tabItem: VueLib['VTabItem'],
  tabsSlider: VueLib['VTabsSlider'],
  textField: VueLib['VTextField']
}
function makeComponent( h, metaData, rootThis ) {
  var isArray = Array.isArray(metaData);
  if (isArray) {
    throw "Array is not allowed metaData";
    return;
  }
  var component = metaData.component;
  var vueComponent = uiElementToVueCompMap[component] || component;
  var dataObj = ['class', 'style', 'attrs', 'props', 'domProps', 'on', 'nativeOn', 'key', 'ref'].reduce((o,k)=>{
    if (k in metaData) {
    o[k] = Object.keys(metaData[k]).reduce((obj, key)=>{
        var val = metaData[k][key];
        obj[key] = (_.isString(val) && val.indexOf('this.')==0)?deep(rootThis, val.substring(5)): val;
        return obj;
      },{})
    }
    return o;
  },{});
  if (component == 'tabs') {
    dataObj.on = dataObj.on || {};
    dataObj.on.change = (n) => {
      deep( rootThis, metaData.vmodel, n)
      var x = rootThis.tab;
      var y = x;
    }
  }
  if (metaData.vmodel) {
    dataObj.props = dataObj.props || {};
    dataObj.props.value = deep( rootThis, metaData.vmodel );
    if (metaData.tokenId) {
      dataObj.domProps = dataObj.domProps || {};
      dataObj.domProps.tokenValue = ''; //To be filled by getUserData
      rootThis.modelToTokenMap[metaData.vmodel] = metaData.tokenId;
    }
    dataObj.on = dataObj.on || {};
    dataObj.on.input = (e) =>{
      deep( rootThis, metaData.vmodel, e );
    }
  }
/*  if (metaData.scopedSlots) {
    var keys = Object.keys(metaData.scopedSlots);
    var scopedSlots = {};
     keys.forEach((k) => {
      var slotMetaData = metaData.scopedSlots[k];
      scopedSlots[k] = (props) => makeComponent( h, slotMetaData, rootThis );
    })
    dataObj.scopedSlots = scopedSlots
  }*/
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
  var hhh = h( vueComponent, dataObj, children);
  return hhh;
}
const DynamicSlotComponent = Vue.component('DynamicSlotComponent', {
  props: [ 'uiSchema', 'scopedProps', 'ch_userData' ],
  data() {
    return {}
  },
  vuetify,
  render(h) {
    var data  = this.$options.data();
    return makeComponent( h, this.uiSchema, this );
  },
  mounted() {
  }
});
export default DynamicSlotComponent
