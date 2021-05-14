import Vue from 'vue'
import * as VueLib from 'vuetify/lib'
import _, { method } from 'lodash'
import vuetify from '@/plugins/vuetify'
import PdfApi from '@/services/PdfApi'
import Api from '@/services/Api'
import CommentsManager from './CommentsManager.vue'
import prepScriptletScope from '../_helpers/scopeprep.js'
import { deepGet, deepSet } from '../_helpers/deep.js'
import CHDateField from './CHDateField.vue'
import router from '../router'
import { EventBus } from '../event-bus.js';
import moment from 'moment'

const uiElementToVueCompMap = {
  alert: VueLib['VAlert'],
  autocomplete: VueLib['VAutocomplete'],
  avatar: VueLib['VAvatar'],
  badge: VueLib['VBadge'],
  banner: VueLib['VBanner'],
  bottomNavigation: VueLib['VBottomNavigation'],
  bottomSheet: VueLib['VBottomSheet'],
  breadcrumbs: VueLib['VBreadcrumbs'],
  col: VueLib['VCol'],
  button: VueLib['VBtn'],
  buttonToggle: VueLib['VBtnToggle'],
  calendar: VueLib['VCalendar'],
  calendarDaily: VueLib['VCalendarDaily'],
  calendarMonthly: VueLib['VCalendarMonthly'],
  calendarWeekly: VueLib['VCalendarWeekly'],
  card: VueLib['VCard'],
  cardSubtitle: VueLib['VCardSubtitle'],
  cardTitle: VueLib['VCardTitle'],
  cardText: VueLib['VCardText'],
  cardActions: VueLib['VCardActions'],
  carousel: VueLib['VCarousel'],
  carouselItem: VueLib['VCarouselItem'],
  chip: VueLib['VChip'],
  chipGroup: VueLib['VChipGroup'],
  checkbox: VueLib['VCheckbox'],
  colorPicker: VueLib['VColorPicker'],
  combobox: VueLib['VCombobox'],
  container: VueLib['VContainer'],
  dataIterator: VueLib['VDataIterator'],
  dataFooter: VueLib['VDataFooter'],
  datePicker: VueLib['VDatePicker'],
  dataTable: VueLib['VDataTable'],
  dataTableHeader: VueLib['VDataTableHeader'],
  dialog: VueLib['VDialog'],
  divider: VueLib['VDivider'],
  expansionPanel: VueLib['VExpansionPanel'],
  expansionPanelHeader: VueLib['VExpansionPanelHeader'],
  expansionPanelContent: VueLib['VExpansionPanelContent'],
  expansionPanels: VueLib['VExpansionPanels'],
  editDialog: VueLib['VEditDialog'],
  fileInput: VueLib['VFileInput'],
  footer: VueLib['VFooter'],
  form: VueLib['VForm'],
  hover: VueLib['VHover'],
  icon: VueLib['VIcon'],
  image: VueLib['VImg'],
  input: VueLib['VInput'],
  item: VueLib['VItem'],
  itemGroup: VueLib['VItemGroup'],
  lazy: VueLib['VLazy'],
  list: VueLib['VList'],
  listGroup: VueLib['VListGroup'],
  listItem: VueLib['VListItem'],
  listItemAction: VueLib['VListItemAction'],
  listItemActionText: VueLib['VListItemActionText'],
  listItemAvatar: VueLib['VListItemAvatar'],
  listItemContent: VueLib['VListItemContent'],
  listItemGroup: VueLib['VListItemGroup'],
  listItemIcon: VueLib['VListItemIcon'],
  listItemSubtitle: VueLib['VListItemSubtitle'],
  listItemTitle: VueLib['VListItemTitle'],
  menu: VueLib['VMenu'],
  navigationDrawer: VueLib['VNavigationDrawer'],
  overflowButton: VueLib['VOverflowBtn'],
  overlay: VueLib['VOverlay'],
  pagination: VueLib['VPagination'],
  parallax: VueLib['VParallax'],
  progressCircular: VueLib['VProgressCircular'],
  progressLinear: VueLib['VProgressLinear'],
  overlay: VueLib['VOverlay'],
  overlay: VueLib['VOverlay'],
  radio: VueLib['VRadio'],
  rangeSlider: VueLib['VRangeSlider'],
  radioGroup: VueLib['VRadioGroup'],
  rating: VueLib['VRating'],
  responsive: VueLib['VResponsive'],
  row: VueLib['VRow'],
  select: VueLib['VSelect'],
  sheet: VueLib['VSheet'],
  simpleCheckbox: VueLib['VSimpleCheckbox'],
  simpleTable: VueLib['VSimpleTable'],
  skeletonLoader: VueLib['VSkeletonLoader'],
  slider: VueLib['VSlider'],
  slideGroup: VueLib['VSlideGroup'],
  slideItem: VueLib['VSlideItem'],
  snackbar: VueLib['VSnackbar'],
  spacer: VueLib['VSpacer'],
  sparkline: VueLib['VSparkline'],
  stepper: VueLib['VStepper'],
  stepperContent: VueLib['VStepperContent'],
  stepperHeader: VueLib['VStepperHeader'],
  stepperItems: VueLib['VStepperItems'],
  stepperStep: VueLib['VStepperStep'],
  subheader: VueLib['VSubheader'],
  switch: VueLib['VSwitch'],
  tab: VueLib['VTab'],
  tabs: VueLib['VTabs'],
  tabsItems: VueLib['VTabsItems'],
  tabItem: VueLib['VTabItem'],
  tabsSlider: VueLib['VTabsSlider'],
  textarea: VueLib['VTextarea'],
  textField: VueLib['VTextField'],
  timePicker: VueLib['VTimePicker'],
  timeline: VueLib['VTimeline'],
  timelineItem: VueLib['VTimelineItem'],
  toolbar: VueLib['VToolbar'],
  toolbarTitle: VueLib['VToolbarTitle'],
  toolbarItems: VueLib['VToolbarItems'],
  tooltip: VueLib['VTooltip'],
  treeview: VueLib['VTreeview'],
  virtualScroll: VueLib['VVirtualScroll'],
  window: VueLib['VWindow'],
  windowItem: VueLib['VWindowItem'],
  conversation: CommentsManager,
  dateField: CHDateField

}
var coreUserFields = ["email", "name", "firstName", "middleName", "lastName", "dateOfBirth", "ssn", "language"];

function ensureDate( val ) {
  if (!val) return null;
  return _.isString(val)?moment(val).toDate():val;
}
function makeFunction( funcSpec, name ) {
  try {
    if (_.isString(funcSpec)) {
      return Function.apply( null, [funcSpec]);
    } else {
      var getSetObj = null;
      if (funcSpec.set) {
        getSetObj = getSetObj || {};
        getSetObj.set = makeFunction( funcSpec.set, name+':set' );
      }
      if (funcSpec.get) {
        getSetObj = getSetObj || {};
        getSetObj.get = makeFunction( funcSpec.get, name+':get' );
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
  } catch (e) {
    console.log('makeFunction error for '+name+':'+e);
  }
}

function getModelValue( rootThis, pScopedProps, src ) {
  try {
    var isObjRef = /^[\w\$\s\.]+$/.test(src);
    if (isObjRef) {
      var val = null;
      if (pScopedProps) {
        val = deepGet(pScopedProps, src);
        if (val !== undefined) return val;
      }
      return deepGet(rootThis, src)/* || null*/;
    }
    var script = prepScriptletScope(rootThis, pScopedProps, src);
    var func = Function.apply( null, ["rootThis", "scopedProps", 'return '+script]);
    return (func)(rootThis, pScopedProps);
  } catch(e) {
    console.log('getModelValue error for '+src+' ('+e+')');
  }
}
function setModelValue( rootThis, pScopedProps, src, val ) {
  try {
    var retVal = deepSet(rootThis, src, val);
    if (retVal !== undefined) {
      return retVal;
    }
    var script = src + ' = val;' 
    script = prepScriptletScope(rootThis, pScopedProps, script);
    var func = Function.apply( null, ["rootThis", "scopedProps", "val", script]);

    (func)(rootThis, pScopedProps, val);

  } catch(e) {
    console.log('setModelValue error for '+src+' ('+e+')');
  }
}
function propValsFromModel( ctx, props ) {
  if (!props) return {};
  var val = Object.keys(props).reduce((mp,p)=>{
    if (p.indexOf(':')==0) {
      mp[p.substring(1)] = getModelValue( ctx.rootThis, {}, props[p])
    } else {
      mp[p] = props[p];
    }
    return mp;
  },{});
  return val;
}
function makeComponent( h, metaData, ctx, pScopedProps ) {
  if (_.isString(metaData)) {
    return {text:metaData};
  }
  var isArray = Array.isArray(metaData);
  if (metaData.debug) {
    debugger;
  }
  var rootThis = ctx.rootThis;
  var contents = [];
  if (!isArray) {
    if ((metaData.omit && getModelValue( rootThis, pScopedProps, metaData.omit)) ||
        (metaData.show && !getModelValue( rootThis, pScopedProps, metaData.show))) {
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
      var dataList = getModelValue( rootThis, pScopedProps, metaData.dataList) || [];
      return dataList.map((e)=>{
        var contentMeta = Object.assign({}, metaData.contents);
        var loopItemProps = {}
        loopItemProps[metaData.itemAlias || 'item'] = e;
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
            if (isLiteral && key != 'rules') {
              obj[key] = val;
            } else {
              key = key.replace(/:/g,'');
              if (key == "rules") {
                obj.rules = val.map(f=>rootThis[f]);
              } else if (k == 'props' && key == "value") {
                let tmp = getModelValue( rootThis, pScopedProps, val);
                obj[key] = metaData.ensureDate?ensureDate(tmp):tmp;
              } else {
                obj[key] = getModelValue( rootThis, pScopedProps, val);
              }
            }
            return obj;
          },{})
        } else {
          var val = metaData[kk];
          var isLiteral = kk.indexOf(":")!=0;
          o[k] = isLiteral?val:getModelValue( rootThis, pScopedProps, val );
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
          dataObj[ot] = getModelValue( rootThis, pScopedProps, onMeta )
          return;
        }
        Object.keys(onMeta).forEach(ev=>{
          var funcSpec = metaData[ot][ev];
          var eventParts = ev.split('.');
          var event = eventParts[0];
          var eventFunc = null;
          if (_.isString(funcSpec) && funcSpec.indexOf("page:")==0) {
            eventFunc = () => {
              rootThis._gotoAppPage( funcSpec.substring(5) );
            }
          } else if (_.isString(funcSpec) && rootThis[funcSpec]) {
            eventFunc = (param) => {
              (()=>{
                (rootThis[funcSpec]).call(rootThis, param )
              })();
            }
          } else if (pScopedProps && _.isString(funcSpec) && pScopedProps[funcSpec]) {
            eventFunc = (param) => {
              (()=>{
                (pScopedProps[funcSpec]).call(rootThis, param )
              })();
            }
          } else {
            eventFunc = (param) => {
              var func = null;
              if (funcSpec.method) {
                func = rootThis[funcSpec.method];
                if (func) (func).call(rootThis);
              } else {
                var script = prepScriptletScope(rootThis, pScopedProps, _.isString(funcSpec)?funcSpec:funcSpec.body);
                var func = Function.apply( null, ["rootThis", "scopedProps", script]);
                (()=>{
                  (func)(rootThis, Object.assign({},pScopedProps));
                })();
              }
            }
          }
          if (eventParts.length>1) {
            eventParts = eventParts.slice(1);
            var modifierMap = eventParts.reduce((mp,p)=>{
              mp[p] = p;
              return mp;
            },{});
            ['ctrl', 'shift', 'alt', 'meta'].forEach(e=>{
              if (modifierMap[e]) {
                var origEventFunc = eventFunc;
                eventFunc = (param) => {
                  if (!param[e+'Key']) return;
                  return (origEventFunc)(param);
                }
              }
            });
            if (modifierMap.stop) {
              var origEventFunc = eventFunc;
              eventFunc = (param) => {
                param.stopPropagation();
                return (origEventFunc)(param);
              }
            }
            if (modifierMap.prevent) {
              var origEventFunc = eventFunc;
              eventFunc = (param) => {
                param.preventDefault();
                return (origEventFunc)(param);
              }
            }
            const keyCodes = {
              esc: 27,
              tab: 9,
              enter: 13,
              space: 32,
              up: 38,
              left: 37,
              right: 39,
              down: 40,
              'delete': [8, 46]
            }
            eventParts.forEach(p=>{
              if (/\d+$/.test(p)) {
                keyCodes[p] = parseInt(p);
              }
            })
            Object.keys(keyCodes).forEach(kc=>{
              if (modifierMap[kc]) {
                var keyVal = keyCodes[kc];
                var origEventFunc = eventFunc;
                if (Array.isArray(keyVal)) {
                  eventFunc = (param) => {
                    if (!keyVal.find(e=>(e===param.keyCode))) return;
                    return (origEventFunc)(param);
                  }      
                } else {
                  eventFunc = (param) => {
                    if (!param.keyCode !== keyVal) return;
                    return (origEventFunc)(param);
                  }    
                }
              }
            })
          }
          if (eventFunc) onObj[event] = eventFunc;
        })
      }  
    })
    const valFromChangeComponents = ['tabs', 'carousel', 'buttonToggle', 'chipGroup', 'itemGroup', 'listItemGroup', 'slideGroup', 'checkbox',
    'switch', 'bottomNavigation', 'progressLinear', 'stepper', 'window'];
    //Calendar? 
    if (valFromChangeComponents.find(e=>(component==e))) {
      dataObj.on = dataObj.on || {};
      dataObj.on.change = (n) => {
        setModelValue( rootThis, pScopedProps, metaData.vmodel || deepGet(metaData.props,"value") || deepGet(metaData.props, ':value') || metaData.value || metaData[':value'], n);
      }
    }
    if (metaData[':value']) {
      dataObj.props = dataObj.props || {};
      let tmp = getModelValue( rootThis, pScopedProps, metaData[':value'] );
      dataObj.props.value = metaData.ensureDate?ensureDate(tmp):tmp;
    }
    if (metaData.vmodel) {
      dataObj.props = dataObj.props || {};
      let tmp = getModelValue( rootThis, pScopedProps, metaData.vmodel );
      dataObj.props.value = metaData.ensureDate?ensureDate(tmp):tmp;
      dataObj.on = dataObj.on || {};
      dataObj.on.input = (val) =>{
        setModelValue( rootThis, pScopedProps, metaData.vmodel, val );
      }
    }
    if (metaData.userData) {
      var userDataId = deepGet(metaData, 'userData.id') || metaData.userData || '';
      if (userDataId) {
        var modelField = metaData.vmodel || deepGet(metaData.props,"value") || deepGet(metaData.props, ':value') || deepGet(metaData, 'userData.model') || userDataId;
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
        o[m] = makeFunction(uiMethods[m], m);
      } catch(e) {
        console.log('Method '+m+' error: '+e);
      }
      return o;
    },{});
  }
  methods._merge = _.merge;
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
      try {
      var response = await Api().post('/vendorapplication/apppost', {app:app, httpMethod: 'GET', postId:postId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    } catch(e) {
      console.log(e);
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
//      var result = response.data;
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
    console.log('gotoAppPage '+page+'; '+JSON.stringify(appParams))
    setTimeout(() => {
      router.push({ name: 'AppPageReset', params: { app:app, page:page, appParams:appParams } });
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
  methods._getUserData = (userId, pTarget, pModelToUserDataMap, cb) => {
    var vm = ctx.rootThis;
    var modelToUserDataMap = pModelToUserDataMap || vm.modelToTokenMap;
    var target = pTarget || vm;
    if (!userId) return;
    var userDataIds = Object.keys(modelToUserDataMap).reduce((o,m)=>{
      var userDataId = modelToUserDataMap[m];
      if (!coreUserFields.find(f=>(f==userDataId))) {
        o[userDataId] = userDataId
      }
      return o;
    },{})

    userDataIds = Object.keys(userDataIds);
    (async () => {
      var user = {};
      var tokenToModelMap = Object.keys(modelToUserDataMap).reduce((o,m)=>{
        var models = o[modelToUserDataMap[m]] || (o[modelToUserDataMap[m]]=[])
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
          deepSet( target, m, user[f])
        })
      })
      userDataList.forEach(ud=>{
        var models = tokenToModelMap[ud.name] || [];
        models.forEach((model)=>{
          if (model && ud.content) {
            deepSet( target, model, ud.content );
          }
        });
      })
      if (cb) {
        (cb).call(ctx.rootThis, ctx.rootThis);
      }
    })();
  }
  methods._getUserDataForList = (pUserIds, list, userIdField, fieldMap, cb) => {
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
        var cloudHavenUserId = deepGet(e, userIdField);
        if (cloudHavenUserId) {
          var user = userMap[cloudHavenUserId];
          if (user) {
            userDataList = coreUserFields.map(f=>({name:f, content:user[f]}));
          }
          userDataList = userDataList.concat(userDataMap[cloudHavenUserId]||[]);
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
      var func = makeFunction( filters[m], m );
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
      var func = makeFunction( computed[m], m );
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
  console.log('DYNAMIC COMPONENT '+cCfg.name);
  var ctx = {rootThis:null, route:pCtx.route, app:pCtx.app};
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
    methods: makeMethods( ctx, cCfg.methods ),
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
      ctx.rootThis._appParams = deepGet(this.$route, "params.appParams")
      ctx.rootThis._moment = moment;
      ctx.rootThis.modelToTokenMap = {};
      if (cCfg.components) {
        //Should not get here
        ctx.components = Object.assign({},makeDynamicComponents( ctx, cCfg.components ));
      }
      if (this['beforeCreate']) {
        (this['beforeCreate'])();
      }
    },
    created() {
    if (this['created']) {
        (this['created'])();
      }
    },
    beforeMount() {
      if (this['beforeMount']) {
        (this['beforeMount'])();
      }
    },
    mounted() {
      if (this['mounted']) {
        (this['mounted'])();
      }
    },
    beforeUpdate() {
      if (this['beforeUpdate']) {
        (this['beforeUpdate'])();
      }
    },
    updated() {
      if (this['updated']) {
        (this['updated'])();
      }
    },
    beforeDestroy() {
      if (this['beforeDestroy']) {
        (this['beforeDestroy'])();
      }
    },
    destroyed() {
      if (this['destroyed']) {
        (this['destroyed'])();
      }
    }/*, Vue 3 lifecycle events
    activated() {
      if (this['activated']) {
        (this['activated'])();
      }
    },
    deactivated() {
      if (this['deactivated']) {
        (this['deactivated'])();
      }
    },
    beforeUnmount() {
      if (this['beforeUnmount']) {
        (this['beforeUnmount'])();
      }
    },
    unmounted() {
      if (this['unmounted']) {
        (this['unmounted'])();
      }
    },
    renderTracked() {
      if (this['renderTracked']) {
        (this['renderTracked'])();
      }
    },
    renderTriggered() {
      if (this['renderTriggered']) {
        (this['renderTriggered'])();
      }
    },
    deactivated() {
      if (this['deactivated']) {
        (this['deactivated'])();
      }
    }*/
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
    var ctx = {rootThis:null, route:this.$route, app: Object.assign({},this.app)};
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
      methods: makeMethods( ctx, this.uiConfig.methods ),
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
        ctx.rootThis._app = ctx.app;
        ctx.rootThis._appParams = deepGet(this.$route, "params.appParams")
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