import Vue from 'vue'
import * as VueLib from 'vuetify/lib'
import _, { method } from 'lodash'
import vuetify from '@/plugins/vuetify'
import Api from '@/services/Api'
import deep from 'deep-get-set'
import CommentsManager from './CommentsManager.vue'
//import CHTable from './CHTable.vue'
import router from '../router'
import { EventBus } from '../event-bus.js';

const uiElementToVueCompMap = {
  row: VueLib['VRow'],
  col: VueLib['VCol'],
  conversation: CommentsManager,
  button: VueLib['VBtn'],
  spacer: VueLib['VSpacer'],
  card: VueLib['VCard'],
  cardTitle: VueLib['VCardTitle'],
  cardBody: VueLib['VCardText'],
  cardActions: VueLib['VCardActions'],
  container: VueLib['VContainer'],
  divider: VueLib['VDivider'],
//  dataTable: CHTable, 
//  staticTable: VueLib['VDataTable'],
  dataTable: VueLib['VDataTable'],
  dialog: VueLib['VDialog'],
  expansionPanel: VueLib['VExpansionPanel'],
  expansionPanelHeader: VueLib['VExpansionPanelHeader'],
  expansionPanelContent: VueLib['VExpansionPanelContent'],
  expansionPanels: VueLib['VExpansionPanels'],
  form: VueLib['VForm'],
  icon: VueLib['VIcon'],
  select: VueLib['VSelect'],
  tab: VueLib['VTab'],
  tabs: VueLib['VTabs'],
  tabsItems: VueLib['VTabsItems'],
  tabItem: VueLib['VTabItem'],
  tabsSlider: VueLib['VTabsSlider'],
  checkbox: VueLib['VCheckbox'],
  textarea: VueLib['VTextarea'],
  textField: VueLib['VTextField'],
  toolbar: VueLib['VToolbar'],
  toolbarTitle: VueLib['VToolbarTitle'],
  toolbarItems: VueLib['VToolbarItems']
}
function makeFunction( methodSpec ) {
  var args = methodSpec.args || [];
  args.push(methodSpec.body);
  return Function.apply( null, args);
}
function makeComponent( h, metaData, rootThis, scopedProps ) {
  var isArray = Array.isArray(metaData);
  var contents = [];
  if (!isArray) {
    if (metaData.component == 'dynamicComponent') {
      debugger;
      var app = rootThis.$options.props.app;
      return h( DynamicUI, {props:{uiConfig:metaData.config, app:app}})
    }
    contents = metaData.contents;
    var component = metaData.component;
    var vueComponent = uiElementToVueCompMap[component] || component;
    var dataObj = ['class', 'style', 'attrs', 'props', 'domProps', 'nativeOn', 'key', 'ref'].reduce((o,k)=>{
      if (k in metaData) {
          if (metaData[k] instanceof Object) {
          o[k] = Object.keys(metaData[k]).reduce((obj, key)=>{
            var val = metaData[k][key];
            if (key == "rules") {
              obj.rules = val.map(f=>rootThis[f]);
            } else {
              obj[key] = (_.isString(val) && val.indexOf('this.')==0)?deep(rootThis, val.substring(5)): val;
            }
            return obj;
          },{})
        } else {
          var val = metaData[k];
          o[k] = val.indexOf('this.')==0?deep(rootThis, val.substring(5)): val;
        }
      }
      return o;
    },{});
    if (metaData.to) {
      dataObj.on = dataObj.on || {};
      dataObj.on.click = rootThis._gotoRoute(metaData.to);
    }
    ["nativeOn", "on"].forEach(ot=>{
      if (metaData[ot]) {
        dataObj[ot] = dataObj[ot] || {};
        var onObj = dataObj[ot];
        Object.keys(metaData[ot]).forEach(ev=>{
          var funcSpec = metaData[ot][ev];
          if (_.isString(funcSpec)) {
            onObj[ev] = (event) => {
//              (Function.apply( rootThis, ['props', `this.${funcSpec.funcSpec}(props);`]))(scopedProps)
              (rootThis[funcSpec])(scopedProps)
            }
          } else {
            var func = null;
            if (funcSpec.method) {
//               func = Function.apply( rootThis, ['props', `this.${funcSpec.method}(props);`]);
              func = rootThis[funcSpec.method];
            } else { //body
              func = Function.apply( rootThis, [funcSpec.body]); //FIXME?
            }
            onObj[ev] = (event) => {
              (func).call(rootThis, scopedProps?(funcSpec.scopedProp?scopedProps[funcSpec.scopedProp]:scopedProps):null);
              if (funcSpec.eventModifier == "stop") {
                event.stopPropagation();
              } else if (funcSpec.eventModifier == "prevent") {
                event.preventDefault();
              }
            }

          }
        })
      }  
    })
    if (component == 'tabs') {
      dataObj.on = dataObj.on || {};
      dataObj.on.change = (n) => {
        deep( rootThis, metaData.vmodel, n);
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
  /*  if (scopedProps) {
      dataObj.props = dataObj.props || {};
      dataObj.props.scopedProps = scopedProps;
    }*/
    if (metaData.scopedSlots) {
      dataObj.scopedSlots = {}
      var keys = Object.keys(metaData.scopedSlots);
      keys.forEach((slot) => {
        var slotMetaData = metaData.scopedSlots[slot];
        dataObj.scopedSlots[slot] = (scopedProps) => {
          return makeComponent( h, slotMetaData, rootThis, scopedProps );
        }
      })
    }
    if (metaData.defaultSlot) {
      dataObj.scopedSlots = dataObj.scopedSlots || {};
      dataObj.scopedSlots.default = () => {
        return makeComponent( h, metaData.defaultSlot, rootThis, scopedProps);
      }
    }  
  } else {
    contents = metaData;
  }
  var children = null;
  if (!isArray && metaData.contentsAsScopedProp) {
    children = deep(scopedProps, metaData.contentsAsScopedProp);
  } else if (contents) {
    if (_.isString( contents)) {
      children = contents;
    } else if (Array.isArray( contents )) {
      children = contents.map((el)=>{ return makeComponent( h, el, rootThis, scopedProps ); })
    } else {
      children = [makeComponent( h, contents, rootThis, scopedProps )]
    }
  } else if (metaData.template) {
    const compiledTemplate = Vue.compile(metaData.template);
    children = [compiledTemplate.render.call(rootThis, h)]
  }
  if (isArray) {
    return children;
  }
  return h( vueComponent, dataObj, children);
}

const DynamicUI = Vue.component('DynamicUI', {
  props: {
    uiConfig: { type: Object, required: true },
    //{ requiredUserData, uiSchema, dataModel, uiMethods }
    app: { type: Object, required: true }
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    var ctx = {vThis:null};
    var methods = {};
    if (this.uiConfig.uiMethods) {
      methods = Object.keys(this.uiConfig.uiMethods).reduce((o,m)=>{
        try {
          o[m] = makeFunction(this.uiConfig.uiMethods[m]);
        } catch(e) {
          console.log('Method '+m+' error: '+e);
        }
        return o;
      },{});
    }
    var computed = this.uiConfig.computed?Object.keys(this.uiConfig.computed).reduce((o,m)=>{
      try {
        o[m] = makeFunction( this.uiConfig.computed[m] );
      } catch (e) {
        console.log('Computed '+m+' error: '+e);
      }
      return o;
    },{}):{};
    var app = {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id};
    methods._appGet = (postId, cb) => {
      (async () => {
        var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:postId});
        if (cb) {
          (cb).call(ctx.vThis, response.data);
        }
      })();
    };
    methods._appPost = (postId, postData, cb) => {
      var vm = ctx.vThis;
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
        if (updates.length>0) {
          var response = await Api().post("/userdata/batchupsert", {userId: vm.$store.state.user._id, updates: updates});
          var result = response.data;
        }
        var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'POST', postId:postId, postData:postData});
        Object.keys(savedUserData).forEach(m=>{
          deep( vm, m, savedUserData[m])
        });
        if (cb) {
          vm.$nextTick(() =>{
            setTimeout(() => {
              (cb).call(ctx.vThis, response.data);
              if (response.data.newPage) {
                router.push({ name: 'AppPageReset', 
                  params: {
                    app:app,
                    page:response.data.newPage } })
              }
            }, 100)
          })
        }
      })();
    };
    methods._eventBusOn = ( id, f) => {
      EventBus.$on(id, f);
    }
    methods._showNotification = ( msg ) => {
      EventBus.$emit('global success alert', msg);
    }
    methods._showError = ( msg ) => {
      EventBus.$emit('global error alert', msg);
    }
    methods._gotoRoute = (routeObj) => {
      router.push(routerObj);
    }
    methods._routerGoBack = () => {
      router.go(-1);
    }
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
      methods.test = () => {
        alert('test here');
      }
    }
//    outerThis.uiConfig.dataModel.ch_userData = outerThis.uiConfig.requiredUserData?outerThis.uiConfig.requiredUserData.reduce((o,f)=>{
    this.uiConfig.dataModel.ch_userData = this.uiConfig.requiredUserData?this.uiConfig.requiredUserData.reduce((o,f)=>{
      o[f] = '';
      return o;
    },{}):{}
    var dataModel = this.uiConfig.dataModel;
    var uiSchema = this.uiConfig.uiSchema;
    this.vThis = new Vue({
      props: {
        app: app
      },
      el: '#dynamicUIDiv',
      data() {
        return Object.assign({},dataModel);
      },
      store: this.$store,
      vuetify,
      methods: methods,
      computed: computed,
      render(h) {
        this.modelToTokenMap = Object.keys(dataModel.ch_userData).reduce((o,p)=>{
          o['ch_userData.'+p] = p;
          return o;
        },{});
        return makeComponent( h, uiSchema, ctx.vThis );
      },
      beforeCreate() {
        ctx.vThis = this;
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