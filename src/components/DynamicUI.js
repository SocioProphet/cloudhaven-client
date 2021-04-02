import Vue from 'vue'
import * as VueLib from 'vuetify/lib'
import _, { method } from 'lodash'
import vuetify from '@/plugins/vuetify'
import PdfApi from '@/services/PdfApi'
import Api from '@/services/Api'
import CommentsManager from './CommentsManager.vue'
//import CHTable from './CHTable.vue'
import { deepGet, deepSet } from '../_helpers/deep.js'
import CHDateField from './CHDateField.vue'
import router from '../router'
import { EventBus } from '../event-bus.js';
import moment from 'moment'

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
  dateField: CHDateField,
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
  radio: VueLib['VRadio'],
  radioGroup: VueLib['VRadioGroup'],
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
  toolbarItems: VueLib['VToolbarItems'],
  tooltip: VueLib['VTooltip']
}
var coreUserFields = ["email", "firstName", "lastName", "dateOfBirth", "ssn", "language"];

function makeFunction( methodSpec ) {
  var args = methodSpec.args || [];
  args.push(methodSpec.body);
  return Function.apply( null, args);
}
function getModelValue( rootThis, val ) {
  if (_.isString(val) && val.indexOf('this.')==0) {
    return deepGet(rootThis, val.substring(5));
  } else if (val instanceof Object) {
    var func = null;
    if (val.method) {
      func = rootThis[val.method];
      return (func)();
    } else if (val.body) { //body
      func = Function.apply( rootThis, [val.body]);
      return (func)();
    } else {
      return val;
    }
  } else {
    return val;
  }
}
function propValsFromModel( rootThis, props ) {
  if (!props) return {};
  var val = Object.keys(props).reduce((mp,p)=>{
    mp[p] = getModelValue( rootThis, props[p]);
    return mp;
  },{});
  return val;
}
function makeComponent( h, metaData, ctx, scopedProps ) {
  var isArray = Array.isArray(metaData);
  var rootThis = ctx.rootThis;
  var contents = [];
  if (!isArray) {
    if (metaData.component=='template') {
      return Vue.compile(metaData.template).render.call( rootThis, h);  
    }
    if (metaData.component == 'dynamicComponent') {
      return h( ctx.components[metaData.name], {props:metaData.props?propValsFromModel( rootThis, metaData.props):{}});
    }
    contents = metaData.contents;
    var component = metaData.component;
    var vueComponent = uiElementToVueCompMap[component] || component;
    var dataObj = ['class', 'style', 'attrs', 'props', 'domProps', 'key', 'ref'].reduce((o,k)=>{
      if (k in metaData) {
          if (metaData[k] instanceof Object) {
          o[k] = Object.keys(metaData[k]).reduce((obj, key)=>{
            var val = metaData[k][key];
            if (key == "rules") {
              obj.rules = val.map(f=>rootThis[f]);
            } else {
              obj[key] = getModelValue( rootThis, val);
            }
            return obj;
          },{})
        } else {
          var val = metaData[k];
          o[k] = val.indexOf('this.')==0?deepGet(rootThis, val.substring(5)): val;
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
            if (funcSpec.indexOf("page:")==0) {
              onObj[ev] = () => {
                rootThis._gotoAppPage( funcSpec.substring(5) );
              }
            } else {
              onObj[ev] = (event) => {
  //              (Function.apply( rootThis, ['props', `this.${funcSpec.funcSpec}(props);`]))(scopedProps)
                (rootThis[funcSpec])(event, scopedProps)
              }
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
              (func).call(rootThis, scopedProps?(funcSpec.scopedProp?deepGet(scopedProps,funcSpec.scopedProp):scopedProps):null);
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
        deepSet( rootThis, metaData.vmodel, n);
      }
    }
    if (metaData.vmodel) {
      dataObj.props = dataObj.props || {};
      dataObj.props.value = deepGet( rootThis, metaData.vmodel );
      if (metaData.tokenId) {
        dataObj.domProps = dataObj.domProps || {};
        dataObj.domProps.tokenValue = ''; //To be filled by getUserData
        rootThis.modelToTokenMap[metaData.vmodel] = metaData.tokenId;
      }
      dataObj.on = dataObj.on || {};
      dataObj.on.input = (e) =>{
        deepSet( rootThis, metaData.vmodel, e );
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
          rootThis._scopedProps = Object.assign({}, scopedProps);
          return makeComponent( h, slotMetaData, ctx, scopedProps );
        }
      })
    }
    if (metaData.defaultSlot) {
      dataObj.scopedSlots = dataObj.scopedSlots || {};
      dataObj.scopedSlots.default = () => {
        return makeComponent( h, metaData.defaultSlot, ctx, scopedProps);
      }
    }  
  } else {
    contents = metaData;
  }
  var children = null;
  if (!isArray && metaData.contentsAsScopedProp) {
    children = deepGet(scopedProps, metaData.contentsAsScopedProp);
  } else if (contents) {
    if (_.isString( contents)) {
      children = contents;
    } else if (Array.isArray( contents )) {
      children = contents.map((el)=>{ return makeComponent( h, el, ctx, scopedProps ); })
    } else {
      children = [makeComponent( h, contents, ctx, scopedProps )]
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


function makeMethods( ctx, uiMethods ) {
  var methods = {};
  var app = ctx.app;
  if (uiMethods) {
    methods = Object.keys(uiMethods).reduce((o,m)=>{
      try {
        o[m] = makeFunction(uiMethods[m]);
      } catch(e) {
        console.log('Method '+m+' error: '+e);
      }
      return o;
    },{});
  }
  methods._pdfGet = (postId, cb) => {
    (async () => {
      var response = await PdfApi().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:postId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  };
  methods._appGet = (postId, cb) => {
    (async () => {
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:postId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  };
  methods._appDelete = (postId, cb) => {
    (async () => {
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'DELETE', postId:postId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  };
  methods._userSearch = (searchCriteria, cb) => {
    var vm = ctx.rootThis;
    (async () => {
      var response = await Api().post("/usersearch", searchCriteria);
      var result = response.data;
      if (cb) {
        vm.$nextTick(() =>{
          setTimeout(() => {
            (cb).call(vm, response.data);
          }, 100)
        })
      }
    })();

  }
  methods._appPost = (postId, postData, cb) => {
    var vm = ctx.rootThis;
    if (!vm.$store.state.user) return;
    var updates = [];
    var user = {};
    var savedUserData = Object.keys(vm.modelToTokenMap).reduce((o, m)=>{
      if (m.indexOf('ch_userData.')<0) {
        var token = vm.modelToTokenMap[m];
        var content = deepGet(vm, m);
        var isCoreField = coreUserFields.find(f=>(f==token))
        if (isCoreField) {
          user[token] = content;
        } else {
          updates.push({name: token, content: content})
          o[m] = content;  
        }
        deepSet(vm, m, null);
      }
      return o;
    },{});
    (async () => {
      var userId = postData.userIdField?postData.data[postData.userIdField]:null;
      var response = null;
      if (postData.userIdField) {
        if (!userId) {
          response = await Api().post("/users", user);
          if (response.data) {
            userId = response.data._id;
          }
        } else {
          user._id = userId;
          response = await Api().put('/users'+userId, )
        }
      }
      if (updates.length>0) {
        response = await Api().post("/userdata/batchupsert", {userId: userId, updates: updates});
        var result = response.data;
      }
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'POST', postId:postId, postData:postData});
      Object.keys(savedUserData).forEach(m=>{
        deepSet( vm, m, savedUserData[m])
      });
      if (cb) {
        vm.$nextTick(() =>{
          setTimeout(() => {
            (cb).call(vm, response.data);
          }, 100)
        })
      }
    })();
  };
  methods._deepGet = deepGet;
  methods._deepSet = deepSet;
  methods._gotoAppPage = (page, appParams) => {
    router.push({ name: 'AppPageReset', params: { app:app, page:'apppages/'+page, appParams:appParams } });
  }
  methods._eventBusOn = ( id, f) => {
    EventBus.$on(id, f);
  }
  methods._showNotification = ( msg ) => {
    EventBus.$emit('global success alert', msg);
  }
  methods._showError = ( msg ) => {
    EventBus.$emit('global error alert', msg);
  }
  methods._gotoRoute = (routerObj) => {
    router.push(routerObj);
  }
  methods._routerGoBack = () => {
    router.go(-1);
  }
  methods._lookupCloudHavenUser = (searchSpec, cb) => { //currently on email supported
    (async () => {
      var response = await Api().post('/userinfo/lookup', searchSpec);
      if (response.data) {
        ctx.rootThis.cloudHavenUserId = response.data._id; //this.cloudHavenUserId = user._id;
      }
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }
  methods._getUserData = (userId) => {
    var vm = ctx.rootThis;
    if (!userId) return;
    var tokenIds = Object.keys(vm.modelToTokenMap).reduce((o,m)=>{
      var tokenId = vm.modelToTokenMap[m];
      if (!coreUserFields.find(f=>(f==tokenId))) {
        o[tokenId] = tokenId
      }
      return o;
    },{})

    tokenIds = Object.keys(tokenIds);
    (async () => {
      var user = {};
      var tokenToModelMap = Object.keys(vm.modelToTokenMap).reduce((o,m)=>{
        var models = o[vm.modelToTokenMap[m]] || (o[vm.modelToTokenMap[m]]=[])
        models.push(m);
        return o;
      },{})  

      var response = await Api().get('/userinfo/'+userId);
      if (response.data) {
        user = response.data;
        user.dateOfBirth = moment(user.dateOfBirth).toDate();
      }
      var userDataList = [];
      if (tokenIds.length>0) {
        response = await Api().post('/userdata/batchget', {userIds: [userId], tokenIds: tokenIds});
        var userDataMap = response.data || {};
        userDataList = userDataMap[userId] || [];
      }
      coreUserFields.forEach((f)=>{
        var models = tokenToModelMap[f] || [];
        models.forEach((m)=>{
          deepSet( vm, m, user[f])
        })
      })
      userDataList.forEach(ud=>{
        var models = tokenToModelMap[ud.name];
        models.forEach((model)=>{
          if (model && ud.content) {
            deepSet( vm, model, ud.content );
          }
        });
      })
    })();
  }
  methods._getUserDataForList = (pUserIds, list, fieldMap, cb) => {
    var vm = ctx.rootThis;
    fieldMap = fieldMap || {};
    var tokenIds = Object.keys(fieldMap);
    if (tokenIds.length==0) return;
    (async () => {
      var userMap = null;
      var response = await Api().post("/userinfo/getusers", {userIds:pUserIds})
      if (response.data) {
        userMap = response.data.reduce((mp,u)=>{
          mp[u._id] = u;
          return mp;
        },{});
      }
      response = await Api().post('/userdata/batchget', {userIds: pUserIds, tokenIds: tokenIds});
      var userDataMap = response.data || {};
      list.forEach(e=>{
        var userDataList = [];
        var user = userMap[e.cloudHavenUserId];
        if (user) {
          userDataList = coreUserFields.map(f=>({name:f, content:user[f]}));
        }
        userDataList = userDataList.concat(userDataMap[e.cloudHavenUserId]);
        //user, name, content
        userDataList.forEach(d=>{
          var listField = fieldMap[d.name] || d.name;
          deepSet(e, listField, d.content);
        })
      })
      if (cb) (cb)();
    })();
  };

  return methods;
}
function makeComputed( computed ) {
  return computed?Object.keys(computed).reduce((o,m)=>{
    try {
      o[m] = makeFunction( computed[m] );
    } catch (e) {
      console.log('Computed '+m+' error: '+e);
    }
    return o;
  },{}):{};
}
function makeProps( propsCfg) {
  const propTypeMap = {String:String, Object:Object, Boolean:Boolean, Number:Number, Array:Array, Date:Date, Function:Function, Symbol:Symbol};
  return propsCfg?Object.keys(propsCfg).reduce((mp,p)=>{
    var propCfg = propsCfg[p];
    var prop = {type: propTypeMap[propCfg.type], required:propCfg.required || false};
    if (propCfg.default) prop.default = propCfg.default;
    mp[p] = prop
    return mp;
  },{}):{}
}
function makeDynamicComponent( pCtx, cCfg ) {
  var ctx = {rootThis:null, route:pCtx.route, app:pCtx.app};
  cCfg.dataModel.ch_userData = cCfg.requiredUserData?cCfg.requiredUserData.reduce((o,f)=>{
    o[f] = '';
    return o;
  },{}):{}
  return Vue.component(cCfg.name, {
    props: makeProps( cCfg.props ),
    data() {
      var dataObj = Object.assign({cloudHavenUserId:'', scopedProps:{}},cCfg.dataModel || {});
      dataObj.ctx = ctx || {};
      return dataObj;
    },
    vuetify,
    methods: makeMethods( ctx, cCfg.uiMethods ),
    computed: makeComputed( cCfg.computed ),
    render(h) {
      ctx.rootThis.modelToTokenMap = Object.keys(cCfg.dataModel.ch_userData).reduce((o,p)=>{
        o['ch_userData.'+p] = p;
        return o;
      },{});
      return makeComponent( h, cCfg.uiSchema, ctx );
    },
    beforeCreate() {
      ctx.rootThis = this;
      ctx.rootThis._route = ctx.route;
      ctx.rootThis._moment = moment;
      ctx.rootThis.modelToTokenMap = {};
      if (this['beforeCreate']) {
        (this['beforeCreate'])();
      }
      if (cCfg.components) {
        ctx.components = Object.assign({},makeDynamicComponents( ctx, cCfg.components ));
      }
    },
    created() {
    if (this['created']) {
        (this['created'])();
      }
    },
    mounted() {
      if (this['mounted']) {
        (this['mounted'])();
      }
    }
  })
}
function makeDynamicComponents( pCtx, components ) {
  return components.reduce((mp,cCfg)=>{
    mp[cCfg.name] = makeDynamicComponent( pCtx, cCfg );
    return mp;
  },{})
}
const DynamicUI = Vue.component('DynamicUI', {
  props: {
    uiConfig: { type: Object, required: true },
    //{ requiredUserData, uiSchema, dataModel, uiMethods }
    app: { type: Object, required: true },
    props: {type: Object}
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    var ctx = {rootThis:null, route:this.$route, app: {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id}};

//    outerThis.uiConfig.dataModel.ch_userData = outerThis.uiConfig.requiredUserData?outerThis.uiConfig.requiredUserData.reduce((o,f)=>{
    this.uiConfig.dataModel.ch_userData = this.uiConfig.requiredUserData?this.uiConfig.requiredUserData.reduce((o,f)=>{
      o[f] = '';
      return o;
    },{}):{}
    var dataModel = this.uiConfig.dataModel;
    var uiSchema = this.uiConfig.uiSchema;
    var components = this.uiConfig.components;
    new Vue({
      props: this.props || {},
      el: '#dynamicUIDiv',
      data() {
        var dataObj = Object.assign({cloudHavenUserId:'', scopedProps:{}},dataModel || {});
        dataObj.ctx = ctx || {};
        dataObj.components = {};
        return dataObj;
      },
      store: this.$store,
      vuetify,
      methods: makeMethods( ctx, this.uiConfig.uiMethods ),
      computed: makeComputed( this.uiConfig.computed ),
      render(h) {
        ctx.rootThis.modelToTokenMap = Object.keys(dataModel.ch_userData).reduce((o,p)=>{
          o['ch_userData.'+p] = p;
          return o;
        },{});
        return makeComponent( h, uiSchema, ctx );
      },
      beforeCreate() {
        ctx.rootThis = this;
        ctx.rootThis._route = ctx.route;
        ctx.rootThis._moment = moment;
        ctx.rootThis.modelToTokenMap = {};
        if (this['beforeCreate']) {
          (this['beforeCreate'])();
        }
        if (components) {
          ctx.components = Object.assign({},makeDynamicComponents( ctx, components ));
        }
      },
      created() {
      if (this['created']) {
          (this['created'])();
        }
      },
      mounted() {
        if (this['mounted']) {
          (this['mounted'])();
        }
      }
    })

  }
});

export default DynamicUI;