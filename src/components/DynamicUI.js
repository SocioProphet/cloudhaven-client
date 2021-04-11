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
import Sval from 'sval'

const uiElementToVueCompMap = {
  autocomplete: VueLib['VAutocomplete'],
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

function createJSExec() {
  return new Sval({ ecmaVer:9, sandbox:true })
}
function makeFunction( funcSpec ) {
  var getSetObj = null;
  if (funcSpec.set) {
    getSetObj = getSetObj || {};
    getSetObj.set = makeFunction( funcSpec.set );
  }
  if (funcSpec.get) {
    getSetObj = getSetObj || {};
    getSetObj.get = makeFunction( funcSpec.get );
  }
  if (getSetObj) return getSetObj;
  var args = funcSpec.args || [];
  args.push(funcSpec.body);
  var func = Function.apply( null, args);
  if (_.isString(func)) {
    throw func;
  }
  return func;
}

//sval - https://github.com/Siubaak/sval
/*
npm install sval
const ctx = {
  prop: 'property',
  func: () => {console.log('from the function');}
}
const options = { ecmaVer:9, sandbox:true };

const interpreter = new Sval(options)

interpreter.import( ctx );
interpreter.run(`
  console.log(prop);
  (func)();
  exports.result = 'the result';`
);
console.log('result: '+interpreter.exports.result);

*/
function getModelValue( ctx, src ) {
  try {
    var val = deepGet(ctx.rootThis, src);
    if (val !== undefined) return val;
    ctx.jsExec.import( ctx.rootThis );
    ctx.jsExec.run('exports.result = '+src);
    return ctx.jsExec.exports.result;
  } catch(e) {
    console.log('getModelValue error for '+src+' ('+e+')');
  }
}
function propValsFromModel( ctx, props ) {
  if (!props) return {};
  var val = Object.keys(props).reduce((mp,p)=>{
    if (p.indexOf(':')==0) {
      mp[p.substring(1)] = getModelValue( ctx, props[p])
    } else {
      mp[p] = props[p];
    }
    return mp;
  },{});
  return val;
}
function makeComponent( h, metaData, ctx, pScopedProps ) {
  var isArray = Array.isArray(metaData);
  if (metaData.debug) {
    debugger;
  }
  var rootThis = ctx.rootThis;
  var contents = [];
  if (!isArray) {
    if ((metaData.omit && getModelValue( ctx, metaData.omit)) ||
        (metaData.show && !getModelValue( ctx, metaData.show))) {
      return null;
    }
    if (metaData.component=='template') {
      var context = pScopedProps?_.assignIn({}, rootThis, pScopedProps):rootThis;
      return Vue.compile(metaData.template).render.call( context, h);
    }
    if (metaData.component == 'dynamicComponent') {
      return h( ctx.components[metaData.name], {props:metaData.props?propValsFromModel( ctx, metaData.props):{}});
    }
    if (metaData.component == "loop") {
      var index = 0;
      var dataList = getModelValue( ctx, metaData.dataList) || [];
      return dataList.map((e)=>{
        var contentMeta = Object.assign({}, metaData.contents);
        var loopItemProps = {}
        loopItemProps[metaData.itemAlias || 'item'] = e;
        ctx.jsExec.import(loopItemProps);
        var newScopedProps = Object.assign( {}, pScopedProps||{}, loopItemProps)
        contentMeta.attrs = contentMeta.attrs || {};
        if (metaData.indexIsKey) {
          contentMeta.attrs.key = index++;
        } else if (metaData.key) {
          contentMeta.attrs.key = e[metaData.key];
        }
        return makeComponent(h, contentMeta, ctx, newScopedProps );
      });
    }
    contents = metaData.contents;
    var component = metaData.component;
    var vueComponent = uiElementToVueCompMap[component] || component;
    var dataObj = ['class', 'style', 'attrs', 'props', 'domProps', 'key', 'ref'].reduce((o,k)=>{
      var kk = (k in metaData)?k:(metaData[':'+k]?(':'+k):null);
      if (kk) {
        if (metaData[kk] instanceof Object) {
          o[k] = Object.keys(metaData[kk]).reduce((obj, key)=>{
            var isLiteral = (key.indexOf(":")!=0);
            var val = metaData[kk][key];
            if (isLiteral) {
              obj[key] = val;
            } else {
              key = key.substring(1)
              if (key == "rules") {
                obj.rules = val.map(f=>rootThis[f]);
              } else {
                obj[key] = getModelValue( ctx, val);
              }
            }
            return obj;
          },{})
        } else {
          var val = metaData[kk];
          var isLiteral = kk.indexOf(":")!=0;
          o[k] = isLiteral?val:getModelValue( ctx, val );
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
        var onMeta = metaData[ot];
        if (_.isString(onMeta)) {
          dataObj[ot] = getModelValue( ctx, onMeta )
          return;
        }
        Object.keys(onMeta).forEach(ev=>{
          var funcSpec = metaData[ot][ev];
          if (_.isString(funcSpec)) {
            if (funcSpec.indexOf("page:")==0) {
              onObj[ev] = () => {
                rootThis._gotoAppPage( funcSpec.substring(5) );
              }
            } else {
              onObj[ev] = (event) => {
                (rootThis[funcSpec])(event )
              }
            }
          } else {
            onObj[ev] = (event) => {
              var func = null;
              if (funcSpec.method) {
                func = rootThis[funcSpec.method];
                if (func) (func).call(rootThis);
              } else { //body
                ctx.jsExec.import( rootThis );
                if (pScopedProps) ctx.jsExec.import( pScopedProps );
                ctx.jsExec.run(funcSpec.body);
              }
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
    if (metaData[':value']) {
      dataObj.props = dataObj.props || {};
      dataObj.props.value = deepGet( rootThis, metaData[':value'] );
    }
    if (metaData.vmodel) {
      dataObj.props = dataObj.props || {};
      dataObj.props.value = deepGet( rootThis, metaData.vmodel );
      dataObj.on = dataObj.on || {};
      dataObj.on.input = (e) =>{
        deepSet( rootThis, metaData.vmodel, e );
      }
    }
    if (metaData.userData) {
      var userDataId = deepGet(metaData, 'userData.id') || metaData.userData || '';
      if (userDataId) {
        var modelField = metaData.vmodel || deepGet(metaData, 'userData.model') || userDataId;
        dataObj.domProps = dataObj.domProps || {};
        dataObj.domProps.tokenValue = ''; //To be filled by getUserData
        rootThis.modelToTokenMap[modelField] = userDataId;
      }
    }
    if (metaData.scopedSlots) {
      dataObj.scopedSlots = {}
      var keys = Object.keys(metaData.scopedSlots);
      keys.forEach((slot) => {
        var slotMetaData = metaData.scopedSlots[slot];
        dataObj.scopedSlots[slot] = (scopedProps) => {
          var newScopedProps = Object.assign({}, scopedProps, pScopedProps);
          ctx.jsExec.import(newScopedProps)
          var retComp = makeComponent( h, slotMetaData, ctx, newScopedProps );
          return retComp;
        }
      })
    }
    if (metaData.defaultSlot) { //This probably is never called and doesn't work - use component contents instead
      dataObj.scopedSlots = dataObj.scopedSlots || {};
      dataObj.scopedSlots.default = () => {
        return makeComponent( h, metaData.defaultSlot, ctx, pScopedProps);
      }
    }  
  } else {
    contents = metaData;
  }
  var children = [];
  if (contents) {
    if (_.isString( contents)) {
      children = contents;
    } else if (Array.isArray( contents )) {
      contents.forEach((el)=>{
        var result = makeComponent( h, el, ctx, pScopedProps );
        if (Array.isArray(result)) {
          children = children.concat(result);
        } else if (result) {
          children.push(result);
        }
      })
    } else {
      var result = makeComponent( h, contents, ctx, pScopedProps );
      if (Array.isArray(result)) {
        children = children.concat(result);
      } else if (result) {
        children.push(result);
      }
    }
  } else if (metaData.template) {
    var context = pScopedProps?_.assignIn({},pScopedProps, rootThis):rootThis;
  children = [Vue.compile(metaData.template).render.call( context, h)];
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
    setTimeout(() => {
      router.push({ name: 'AppPageReset', params: { app:app, page:'apppages/'+page, appParams:appParams } });
    }, 300)
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
    var userDataIds = Object.keys(vm.modelToTokenMap).reduce((o,m)=>{
      var userDataId = vm.modelToTokenMap[m];
      if (!coreUserFields.find(f=>(f==userDataId))) {
        o[userDataId] = userDataId
      }
      return o;
    },{})

    userDataIds = Object.keys(userDataIds);
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
      if (userDataIds.length>0) {
        response = await Api().post('/userdata/batchget', {userIds: [userId], userDataIds: userDataIds});
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
        var models = tokenToModelMap[ud.name] || [];
        models.forEach((model)=>{
          if (model && ud.content) {
            deepSet( vm, model, ud.content );
          }
        });
      })
    })();
  }
  methods._getUserDataForList = (pUserIds, list, fieldMap, cb) => {
    fieldMap = fieldMap || {};
    var userDataIds = Object.keys(fieldMap);
    if (userDataIds.length==0) return;
    (async () => {
      var userMap = null;
      var response = await Api().post("/userinfo/getusers", {userIds:pUserIds})
      if (response.data) {
        userMap = response.data.reduce((mp,u)=>{
          mp[u._id] = u;
          return mp;
        },{});
      }
      response = await Api().post('/userdata/batchget', {userIds: pUserIds, userDataIds: userDataIds});
      var userDataMap = response.data || {};
      list.forEach(e=>{
        var userDataList = [];
        if (e.cloudHavenUserId) {
          var user = userMap[e.cloudHavenUserId];
          if (user) {
            userDataList = coreUserFields.map(f=>({name:f, content:user[f]}));
          }
          userDataList = userDataList.concat(userDataMap[e.cloudHavenUserId]);
        }
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
function makeFilters( ctx, filters ) {
  return filters?Object.keys(filters).reduce((o,m)=>{
    try {
      var func = makeFunction( filters[m] );
      o[m] = (val) => {
        return func.call( ctx.rootThis, val);
      }
    } catch (e) {
      console.log('Computed '+m+' error: '+e);
    }
    return o;
  },{}):{};
}
function makeComputed( computed ) {
  return computed?Object.keys(computed).reduce((o,m)=>{
    try {
      var func = makeFunction( computed[m] );
      if (func) {
        o[m] = func;
      }
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
  var ctx = {rootThis:null, route:pCtx.route, app:pCtx.app, jsExec: createJSExec()};
  cCfg.dataModel.ch_userData = cCfg.requiredUserData?cCfg.requiredUserData.reduce((o,f)=>{
    o[f] = '';
    return o;
  },{}):{}
  return Vue.component(cCfg.name, {
    props: makeProps( cCfg.props ),
    data() {
      var dataObj = Object.assign({cloudHavenUserId:''},cCfg.dataModel || {});
      dataObj.ctx = ctx || {};
      return dataObj;
    },
    vuetify,
    methods: makeMethods( ctx, cCfg.uiMethods ),
    computed: makeComputed( cCfg.computed ),
    filters: makeFilters( ctx, cCfg.filters ),
    watch: makeComputed( cCfg.watch ),
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
      if (cCfg.components) {
        ctx.components = Object.assign({},makeDynamicComponents( ctx, cCfg.components ));
      }
      if (this['beforeCreate']) {
        (this['beforeCreate'])();
      }
    },
    created() {
    ctx.jsExec.import( this );
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
    var ctx = {rootThis:null, route:this.$route, app: {url:this.app.url, vendorId: this.app.vendorId, _id: this.app._id},
                jsExec: createJSExec() };

//    outerThis.uiConfig.dataModel.ch_userData = outerThis.uiConfig.requiredUserData?outerThis.uiConfig.requiredUserData.reduce((o,f)=>{
    this.uiConfig.dataModel.ch_userData = this.uiConfig.requiredUserData?this.uiConfig.requiredUserData.reduce((o,f)=>{
      o[f] = '';
      return o;
    },{}):{}
    var dataModel = this.uiConfig.dataModel;
    var uiSchema = this.uiConfig.uiSchema;
    var components = this.uiConfig.components;
    this.innerVueInstance = new Vue({
      props: this.props || {},
      el: '#dynamicUIDiv',
      data() {
        var dataObj = Object.assign({cloudHavenUserId:''},dataModel || {});
        dataObj.ctx = ctx || {};
        dataObj.components = {};
        return dataObj;
      },
      store: this.$store,
      vuetify,
      methods: makeMethods( ctx, this.uiConfig.uiMethods ),
      computed: makeComputed( this.uiConfig.computed ),
      filters: makeFilters( ctx, this.uiConfig.filters ),
      watch: makeComputed( this.uiConfig.watch ),
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
      ctx.jsExec.import( this );
      if (this['created']) {
          (this['created'])();
        }
      },
      mounted() {
        if (this['mounted']) {
          (this['mounted'])();
        }
      },
      destroyed() {
      },
        })

  },
  beforeDestroy() {
    this.innerVueInstance.$destroy();
  },
  destroyed() {
  },
});

export default DynamicUI;