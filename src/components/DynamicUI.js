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
    requiredUserData:  { type: Array, required: false },
    uiSchema: { type: Object, required: true },
    dataModel: { type: Object, required: true },
    uiMethods: { type: Object, required: true },
    app: { type: Object, required: true }
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    var outerThis = this;
    var methods = Object.keys(this.uiMethods).reduce((o,m)=>{
      var methodSpec = this.uiMethods[m];
      var args = methodSpec.args || [];
      args.push(methodSpec.body);
      o[m] = Function.apply( null, args);
      return o;
    },{});
    var app = {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id};
    methods._appGet = (postId, cb) => {
      (async () => {
        var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:postId});
        if (cb) {
          (cb)(this.vThis, response.data);
        }
      })();
    };
    methods._appPost = (postId, postData, cb) => {
      var vm = this.vThis;
      if (!vm.$store.state.user) return;
      var updates = [];
      var savedUserData = Object.keys(vm.modelToTokenMap).reduce((o, m)=>{
        var token = vm.modelToTokenMap[m];
        var content = deep(vm, m);
        updates.push({name: token, content: content})
        o[m] = content;
        deep(vm, m, null);
        return o;
      },{});
      (async () => {
        var response = await Api().post("/userdata/batchupsert", {userId: vm.$store.state.user._id, updates: updates});
        var result = response.data;
        var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'POST', postId:postId, postData:postData});
        Object.keys(savedUserData).forEach(m=>{
          deep( vm, m, savedUserData[m])
        });
        if (cb) {
          vm.$nextTick(() =>{
            setTimeout(() => {
              (cb)(this.vThis, response.data);
            }, 100)
          })
        }
      })();
    };
    methods.getUserData = () => {
      var vm = this.vThis;
      if (!vm.$store.state.user) return;
      var tokenIds = Object.keys(vm.modelToTokenMap).reduce((o,m)=>{
        var tokenId = vm.modelToTokenMap[m];
        o[tokenId] = tokenId
        return o;
      },{})

      tokenIds = Object.keys(tokenIds);
      if (tokenIds.length==0) return;
      (async () => {
        var response = await Api().post('/userdata/batchget', {userId: vm.$store.state.user._id, tokenIds: tokenIds});
        var userDataList = response.data;
        var tokenToModelMap = Object.keys(vm.modelToTokenMap).reduce((o,m)=>{
          var models = o[vm.modelToTokenMap[m]] || (o[vm.modelToTokenMap[m]]=[])
          models.push(m);
          return o;
        },{})
        userDataList.forEach(ud=>{
          var models = tokenToModelMap[ud.name];
          models.forEach((model)=>{
            if (model && ud.content) {
              deep( vm, model, ud.content );
            }
          });
        })
      })();
    }
    outerThis.dataModel.ch_userData = outerThis.requiredUserData?outerThis.requiredUserData.reduce((o,f)=>{
      o[f] = '';
      return o;
    },{}):{}
    this.vThis = new Vue({
      el: '#dynamicUIDiv',
      data() {
        return outerThis.dataModel;
      },
      store: this.$store,
      vuetify,
      methods: methods,
      render(h) {
        this.modelToTokenMap = Object.keys(outerThis.dataModel.ch_userData).reduce((o,p)=>{
          o['ch_userData.'+p] = p;
          return o;
        },{});
        return makeComponent( h, outerThis.uiSchema, this );
      },
      mounted() {
        if (this['initialize']) {
          (this['initialize'])();
        }
      }
    })

  }
});

export default DynamicUI;