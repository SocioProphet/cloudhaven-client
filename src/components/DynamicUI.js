import Vue from 'vue'
import * as VueLib from 'vuetify/lib'
import _ from 'lodash'
import vuetify from '@/plugins/vuetify'
import Api from '@/services/Api'
import deep from 'deep-get-set'

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
const vModelComponents = [
  'VTextField'
]
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
    o[k] = Object.keys(metaData[k]).reduce((obj, key)=>{
        var val = metaData[k][key];
        obj[key] = (_.isString(val) && val.indexOf('this.')==0)?deep(rootThis, val.substring(5)): val;
        return obj;
      },{})
    }
    return o;
  },{});
  var self = this;
  if (metaData.vmodel) {
    dataObj.props = dataObj.props || {};
    dataObj.props.value = deep( rootThis, metaData.vmodel );
    dataObj.on = dataObj.on || {};
    dataObj.on.input = (e) =>{
      var x = e;
      debugger;
      deep( rootThis, metaData.vmodel, e );
    }
  }
  if (vModelComponents[vueComponent]) {
    dataObj.domProps = dataObj.domProps || {};
    dataObj.domProps.value = self.value;
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
    uiMethods: { type: Object, required: true },
    app: { type: Object, required: true }
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    debugger;
    var outerThis = this;
    var compiledMethods = Object.keys(this.uiMethods).reduce((o,m)=>{
      var methodSpec = this.uiMethods[m];
      var args = methodSpec.args || [];
      args.push(methodSpec.body);
      o[m] = Function.apply( null, args);
      return o;
    },{});
    compiledMethods._appGet = (page, cb) => {
      (async () => {
        var response = await Api().get(`${this.app.url}/${page}`);
        if (cb) {
          (cb)(response.data);
        }
      })();
    };
    compiledMethods._appPost = (page, postData, cb) => {
      (async () => {
        var url = this.app.url+(page?('/'+page):'');
        var response = await Api().post(url, postData);
        if (cb) {
          (cb)(response.data);
        }
      })();
    };
    new Vue({
      el: '#dynamicUIDiv',
      data() {
        debugger;
        return outerThis.dataModel;
      },
      vuetify,
      methods: compiledMethods,
      render(h) {
        return makeComponent( h, outerThis.uiSchema, this );
      },
      mounted() {
        debugger;
        if (this['initialize']) {
          debugger;
          (this['initialize'])();
        }
      }
    })

  }
});

export default DynamicUI;