<template>
  <v-data-table
    :headers="headers"
    :items="items"
    class="elevation-1"
  >
    <template  v-slot:item="{ item }">
      <!--component :is="'DynamicSlotComponent'" :uiSchema="uiSchema" :scopedProps="item"></component-->
      <CHTableRow @rowevent="rowEvent" :item="item" :uiSchema="uiSchema"/>
    </template>
  </v-data-table>
</template>

<script>
//import DynamicSlotComponent from './DynamicSlotComponent.js'
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

var CHTableRow = Vue.component('CHTableRow', {
  props: {
    item: {type: Object, required:true},
    uiSchema: {type: Object, required: true}
  },
  methods: {
    clickEvent() {
      this.$emit('rowevent', this.item)
    }
  },
//  template: `<tr><td>[{{item.firstName}}]</td><td>[{{item.lastName}}]</td><td>[{{item.address}}]</td></tr>`
  render(h) {
    return makeComponent( h, this.$options.propsData.uiSchema, this );
  }
})

export default {
  components: {
    CHTableRow
//    DynamicSlotComponent
  },
  props: {
    uiSchema: { type: Object, required: true },
    headers: {type:Array, required: true},
    items: Array
  },
  methods: {
    rowEvent( data ) {
    }
  },
  data() {
    return {
      compName: 'DynamicSlotComponent'
    }
  },
  mounted() {
  }
}
</script>
