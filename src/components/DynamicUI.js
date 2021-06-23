import Vue from 'vue'
import _, { method } from 'lodash'
import vuetify from '@/plugins/vuetify'
import PdfApi from '@/services/PdfApi'
import Api from '@/services/Api'
import MultipartPostApi from '@/services/MultipartPostApi'
import vcdnUtils from '../_helpers/vcdnutils.js'
import prepScriptletScope from '../_helpers/scopeprep.js'
import { deepGet, deepSet } from '../_helpers/deep.js'
import router from '../router'
import { EventBus } from '../event-bus.js';
import moment from 'moment'
import { mapState } from 'vuex'
import { parseComponent } from 'vue-template-compiler'

//var coreUserFields = ["email", "name", "firstName", "middleName", "lastName", "dateOfBirth", "ssn", "language"];

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
    var vueComponent = vcdnUtils.uiElementToVueCompMap[component] || component;
    var dataObj = {};
    if (metaData.inheritAttrs) {
      dataObj.attrs = rootThis.$attrs;
    }
    ['class', 'style', 'attrs', 'props', 'domProps', 'key', 'ref'].forEach((k)=>{
      var kk = (k in metaData)?k:(metaData[':'+k]?(':'+k):null);
      if (kk) {
        if (metaData[kk] instanceof Object) {
          if (!dataObj[k]) dataObj[k] = {};
          Object.keys(metaData[kk]).forEach((key)=>{
            var isLiteral = (key.indexOf(":")!=0);
            var val = metaData[kk][key];
            if (isLiteral && key != 'rules') {
              dataObj[k][key] = val;
            } else {
              key = key.replace(/:/g,'');
              if (key == "rules") {
                dataObj[k].rules = _.isString(val)?getModelValue( rootThis, pScopedProps, val):val.map(f=>rootThis[f]);
              } else if (k == 'props' && key == "value") {
                let tmp = getModelValue( rootThis, pScopedProps, val);
                dataObj[k][key] = metaData.ensureDate?ensureDate(tmp):tmp;
              } else {
                dataObj[k][key] = getModelValue( rootThis, pScopedProps, val);
              }
            }
          })
        } else {
          var val = metaData[kk];
          var isLiteral = kk.indexOf(":")!=0;
          dataObj[k] = isLiteral?val:getModelValue( rootThis, pScopedProps, val );
        }
      }
    });
    if (metaData.to) {
      dataObj.on = dataObj.on || {};
      dataObj.on.click = rootThis._gotoRoute(metaData.to);
    }
    if (metaData.inheritListeners) {
      dataObj.on = rootThis.$listeners;
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
  if (metaData.component == 'dynamicComponent') {
    var compKey = (metaData.organizationId||'')+'-'+metaData.componentId;
    if (!ctx.components[compKey]) {
      console.log(`Component ${metaData.componentId} not found.`);
      return `[Component ${metaData.componentId} not found.]`;
    }
  }
  return h( metaData.component == 'dynamicComponent'?ctx.components[metaData.organizationId+'-'+metaData.componentId]:vueComponent, dataObj, children);
}


function makeMethods( ctx, uiMethods ) {
  var methods = {};
  var app = ctx.app;
  if (uiMethods) {
    methods = Object.keys(uiMethods).reduce((o,m)=>{
      try {
        o[m] = makeFunction(uiMethods[m], m);
      } catch(e) {
        console.log('Method "'+m+'" error: '+e);
      }
      return o;
    },{});
  }
  methods._merge = _.merge;
  function checkArguments( funcName, params, cb, validations) {
    var errors = [];
    if ((typeof params)!=='object' || Array.isArray(params)) {
      console.log(`${funcName}: missing parameters object.`);
      return;
    }
    validations.forEach(fldObj=>{
      fldObj.rules = fldObj.rules || [];
      var prop = fldObj.name;
      var isRequired = fldObj.rules.indexOf('required');
      if (isRequired>=0 && params[prop]===undefined) {
        errors.push(`${funcName}: missing required parameter "${prop}".`);
      }
      if (params[prop]!==undefined) {
        if (fldObj.rules.indexOf('notblank')>=0 && !params[prop]) {
          errors.push(`${funcName}: parameter "${prop}" cannot be blank.`);
        }
        var dataType = (typeof params[prop]);
        if (fldObj.type=='array') {
          if (!Array.isArray(params[prop])) {
            errors.push(`${funcName}: parameter "${prop}" must be an array.`);
          }
        } else if (fldObj.type=='date') {
          if (!_.isDate(params[prop])) {
            errors.push(`${funcName}: parameter "${prop}" must be a date.`);
          }
        } else if (dataType != fldObj.type) {
          errors.push(`${funcName}: parameter "${prop}" must be type ${fldObj.type}.`)
        }
        if (fldObj.enum) {
          if (fldObj.enum.indexOf(params[prop])<0) {
            errors.push(`${funcName}: parameter "${prop}" must be one of [${fldObj.enum.join(', ')}].`)
          }
        }
      }
    });
    if (cb && (typeof cb)!=='function') {
      errors.push(`${funcName} callback parameter must be a function.`);
    }
    errors.forEach(e=>{
      console.log(e);
    })
    return errors.length==0;
  }
  methods._writeAppData = (params, cb) => {
    var argValidations = [
      {name:'table', rules:['required', 'notblank'], type:'string'},
      {name: 'key', rules:['required','notblank'], type:'string'},
      {name: 'dataString', rules:['required'], type:'string'}
    ];
    if (!checkArguments('_writeAppData', params, cb, argValidations)) return;
    (async () => {
      var response = await Api().post('/appstoremgr/upsert', 
          {organizationId: app.organizationId, table:params.table, key:params.key, jsonData:params.dataString||''});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }
  
  //key is optional - omitting returns all table contents
  //searchOperator is optional - Valid search oerators are 'startsWith' or 'contains'
  methods._readAppData = (params, cb) => {
    if (params && params.searchOperator) params.searchOperator = params.searchOperator.toLowerCase();
    var argValidations = [
      {name: 'table', rules:['required', 'notblank'], type:'string'},
      {name: 'key', type:'string'},
      {name: 'searchOperator', type:'string', enum:['startswith', 'contains']}
    ];
    if (!checkArguments('_readAppData', params, cb, argValidations)) return;
    var body = {organizationId: app.organizationId, table:params.table};
    if (params.key) body.key = params.key;
    if (params.searchOperator) body.searchOperator = params.searchOperator;
    (async () => {
      var response = await Api().post('/appstoremgr/read', body);
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }

  methods._pdfGet = (params, cb) => {
    var argValidations = [
      {name: 'operationId', rules:['required', 'notblank'], type:'string'}
    ];
    if (!checkArguments('_pdfGet', params, cb, argValidations)) return;
    (async () => {
      var response = await PdfApi().post('/organizationapplication/apppost', {app:app, httpMethod: 'GET', operationId:params.operationId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  };
  methods._appGet = (params, cb) => {
    var argValidations = [
      {name: 'subpath', rules:['required', 'notblank'], type:'string'}
    ];
    if (!checkArguments('_appGet', params, cb, argValidations)) return;
    (async () => {
      try {
        var response = await Api().post('/organizationapplication/apppost', {app:app, httpMethod: 'GET', operationId:params.subpath});
        if (cb) {
          (cb).call(ctx.rootThis, response.data);
        }
      } catch(e) {
        console.log(e);
      }
    })();
  };

  //postId = getFile for sandboxapp demo app
  methods._appGetFile = (params, cb) => {
    var argValidations = [
      {name: 'operationId', rules:['required', 'notblank'], type:'string'},
      {name: 'fileId', rules:['required', 'notblank'], type:'string'}
    ];
    if (!checkArguments('_appGetFile', params, cb, argValidations)) return;
    (async () => {
      var URL = `/organizationapplication/appgetfile`;
      var body = {appUrl:app.url, operationId:operationId, fileId:params.fileId}
      try {
        var response = await Api().post(URL, body, {responseType: 'blob', timeout: 30000 });
        var cd = response.headers["content-disposition"];
        var parts = cd.split(/["']/);
        const filename = parts[1];
        const contentType = response.headers["content-type"];
        cb.call(ctx.rootThis, response.data, filename, contentType );
      } catch(e) {
        console.log('_appGetFile error: '+e);
      }
    })();
  }
/* Not currentlt implemented
  methods._appDelete = (params, cb) => {
    var argValidations = [
      {name: 'operationId', rules:['required', 'notblank'], type:'string'}
    ];
    if (!checkArguments('_appGet', params, cb, argValidations)) return;
    (async () => {
      var response = await Api().post('/organizationapplication/apppost', {app:app, httpMethod: 'DELETE', operationId:params.operationId});
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  };*/
  methods._appPost = (params, cb) => {
    var argValidations = [
      {name: 'operationId', rules:['required', 'notblank'], type:'string'},
      {name: 'postData', rules:['required', 'notblank'], type:'object'}
    ];
    if (!checkArguments('_appPost', params, cb, argValidations)) return;
    var vm = ctx.rootThis;
    if (!vm.$store.state.user) return;
    (async () => {
      var response = null;
      if (params.postData.files) {
        var formData = Object.keys(params.postData).reduce((fd,key)=>{
          if (key == 'files') {
            Object.keys(params.postData.files).forEach(fileName=>{
              fd.append('files.'+fileName, params.postData.files[fileName]);
            })
          } else {
            fd.append(key, params.postData[key]);
          }
          return fd;
        },new FormData());
        formData.append("_appUrl", app.url);
        formData.append("_operationId", params.operationId);
        response = await Api().post('/organizationapplication/appmultipartpost', formData );
      } else {
        response = await MultipartPostApi().post('/organizationapplication/apppost', {app:app, httpMethod: 'POST', operationId:params.operationId, postData:params.postData});
      }
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
    var argValidations = [
      {name: 'page', rules:['required', 'notblank'], type:'string'},
      {name: 'appParams', type:'object'}
    ];
    if (!checkArguments('_gotoAppPage', {page:page, appParams:appParams}, null, argValidations)) return;
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
  methods._lookupUser = (searchSpec, cb) => { //currently only email supported
    var argValidations = [
      {name: 'email', type:'string'},
      {name: 'ssn', type:'string'}
    ];
    if (!checkArguments('_lookupUser', searchSpec, cb, argValidations)) return;
    (async () => {
      var response = await Api().post('/userinfo/lookup', searchSpec);
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }
  methods._usersSearch = (searchCriteria, cb) => {
    var argValidations = [
      {name: 'phrase', rules:['required', 'nonblank'], type:'string'},
      {name: 'dateOfBirth', type: 'date'}
    ];
    if (!checkArguments('_usersSearch', searchCriteria, cb, argValidations)) return;
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
  methods._getUserData = (pUserIds, userDataIds, cb) => {
    var argValidations = [
      {name: 'pUserIds', rules:['required'], type:'array'},
      {name: 'userDataIds', rules:['required'], type:'array'}
    ];
    if (!checkArguments('_getUserData', {pUserIds:pUserIds, userDataIds:userDataIds}, cb, argValidations)) return;
    if (userDataIds.length==0) {
      if (cb) cb.call(ctx.rootThis, []);
      return;
    };
    (async () => {
      var response = await Api().post("/userinfo/getusers", {userIds:pUserIds})
      if (response.data) {
        userMap = response.data.reduce((mp,u)=>{
          mp[u._id] = Object.assign({},u);
          return mp;
        },{});
      }
      response = await Api().post('/userdata/batchget', {userIds: pUserIds, userDataIds: userDataIds});
      if (response.data.success) {
        if (cb) cb.call(ctx.rootThis, response.data.userDataMap);
      }
    })();
  };
  methods._writeUserData = (userId, userDataIdToValueMap, cb) => {
    var argValidations = [
      {name: 'userId', rules:['required', 'nonblank'], type:'string'},
      {name: 'userDataIdToValueMap', rules:['required'], type:'object'}
    ];
    if (!checkArguments('_writeUserData', {userId:userId, userDataIdToValueMap:userDataIdToValueMap}, cb, argValidations)) return;
    (async () => {
      var updates = Object.keys(userDataIdToValueMap).reduce((ar,fld)=>{
        ar.push({name:fld, content:userDataIdToValueMap[fld]})
        return ar;
      },[]);
      var response = await Api().post('/userdata/batchupsert', {userId:userId, updates:updates});
      if (cb) cb.call(ctx.rootThis, response.data);
    })();
  }
  methods._writeMultiInstanceUserData = (params, cb) => {
    var argValidations = [
      {name: 'owner', rules:['required', 'nonblank'], type:'string'},
      {name: 'organizationId', rules:['required', 'nonblank'], type:'string'},
      {name: 'key', type: 'string'},
      {name: 'content', type: 'string'}
    ];
    if (!checkArguments('_writeMultiInstanceUserData', params, cb, argValidations)) return;
    (async () => {
      var response = await Api().post('/multiinstanceuserdatamgr/create', params);
      if (cb) cb.call(ctx.rootThis, response.data);
    })();
  }
  methods._getMultiInstanceUserData = (params, cb) => {
    var argValidations = [
      {name: 'owner', rules:['required', 'nonblank'], type:'string'},
      {name: 'organizationId', rules:['required', 'nonblank'], type:'string'},
      {name: 'key', type: 'string', rules:['required', 'nonblank']}
    ];
    if (!checkArguments('_getMultiInstanceUserData', params, cb, argValidations)) return;
    (async () => {
      var response = await Api().post('/multiinstanceuserdatamgr/getcollection', params);
      if (cb) cb.call(ctx.rootThis, response.data);
    })();
  }
  methods._deleteMultiInstanceUserData = (params, cb) => {
    var argValidations = [
      {name: 'owner', rules:['required', 'nonblank'], type:'string'},
      {name: '_id', type:'string'},
      {name: 'organizationId', type:'string'},
      {name: 'key', type: 'string'}
    ];
    if (!checkArguments('_deleteMultiInstanceUserData', params, cb, argValidations)) return;
    if (!params._id && (!params.organizationId || !params.key)) {
      console.log('_deleteMultiInstanceUserData must either have _id or organizationId+key parameters.');
      return;
    }
    (async () => {
      var response = await Api().post('/multiinstanceuserdatamgr/delete', params);
      if (cb) cb.call(ctx.rootThis, response.data);
    })();
  }
  methods._getUserFiles = (userId, cb) =>{
    var argValidations = [
      {name: 'userId', rules:['required', 'nonblank'], type:'string'}
    ];
    if (!checkArguments('_getUserFiles', {userId:userId}, cb, argValidations)) return;
    (async () => {
      var response = await Api().get('/userdata/userfile/list/'+userId);
      if (cb) cb.call(ctx.rootThis, response.data);
    })();
  }
  methods._getUserFile = (params, cb) => {
    var argValidations = [
      {name: 'userId', rules:['required', 'nonblank'], type:'string'},
      {name: 'fileId', rules:['required', 'nonblank'], type:'string'}
    ];
    if (!checkArguments('_getUserFile', params, cb, argValidations)) return;
    (async () => {
      var response = await Api().get(`/userdata/userfile/getfile/${params.userId}/${params.fileId}`,
        {responseType: 'blob', timeout: 30000 });
      var rawFilename = '';
      if (response.headers["content-disposition"]) {
        var parts = response.headers["content-disposition"].split(/["']/);
        rawFilename = parts[1];
      }
      const contentType = response.headers["content-type"];
      if (contentType.indexOf('text/')==0 || contentType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb.call(ctx.rootThis, response.data );
      } else if (contentType == 'application/pdf'  || contentType.indexOf('image/')==0) {
        cb.call(ctx.rootThis, new File( [response.data], rawFilename, {type: contentType}));
      }
    })();
  }
  methods._userFileOperation = (params, cb) => {
    if (params.operation) params.operation = params.operation.toLowerCase();
    if (params.fileType) params.fileType = params.fileType.toLowerCase();
    var argValidations1 = [
      {name: 'userId', rules:['required', 'nonblank'], type:'string'},
      {name: 'operation', rules:['required', 'nonblank'], type:'string', enum:['add', 'update', 'delete']}
    ];
    if (!checkArguments('_userFileOperation', params, cb, argValidations1)) return;
    var addValidations = [
      {name: 'name', rules:['required', 'nonblank'], type:'string'},
      {name: 'fileName', rules:['required', 'nonblank'], type:'string'},
      {name: 'fileType', rules:['required', 'nonblank'], type:'string'/*, enum:['docx', 'text', 'pdf', 'apng', 'avif', 'gif', 'jpeg', 'png', 'svg', 'webp']*/},
      {name: 'file', rules:['required'], type: 'object'}
    ];
    var updValidations = addValidations.concat([
      {name: 'fileId', rules:['required', 'nonblank'], type:'string'}
    ])
    var argValidations = {
      add:addValidations,
      update:updValidations,
      delete: [{name: 'fileId', rules:['required', 'nonblank'], type:'string'}]
    }
    if (!checkArguments('_userFileOperation', params, cb, argValidations[params.operation])) return;
    var mimeType = '';
    if (params.fileType) {
      var fileType = params.fileType.toLowerCase();
      var mimeTypeMap = {
        docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        text:'text/plain',
        pdf:'application/pdf',
        apng:'image/apng',
        avif:'image/avif',
        gif:'image/gif',
        jpeg:'image/jpeg',
        png:'image/png',
        svg:'image/svg+xml',
        webp:'image/webp',
      }
      mimeType = mimeTypeMap[fileType] || fileType;
    } else {
      mimeType = params.mimeType;
    }

    (async () => {
      var formData = new FormData();
      formData.append('operation', params.operation);
      formData.append('userId',  params.userId);
      if (params.operation == 'add' || params.operation=='update') {
        formData.append('name', params.name);
        formData.append('fileName', params.fileName);
        formData.append('mimeType', mimeType);
      }
      if (params.fileId) {
        formData.append('fileId', params.fileId);
      }
      if (params.file) {
        formData.append('files.'+params.fileName, params.file);
      }
      var response = await MultipartPostApi().post('/userdata/userfile', formData);
      if (cb) cb.call(ctx.rootThis, response.data);
    })();

  }
  /*
  {
	"ownerEmail":"richjvann@gmail.com",
	"type": "Task",
	"title": "App-created Task",
	"content": "here is some content for the app-created task, ...",
	"start": "2021-06-15T15:00:00Z",
	"end": "2021-06-15T15:30:00Z",
	"durationType": "timed",
	"organization": "603ee28599a16849b4870d5b",
	"applicationId": "test-app",
  "componentId": "",
  "appConfigData": {...}
}
  */
  methods._addCalendarEntry = ( params, cb ) => {
    if (!params || !_.isObject(params) || Array.isArray(params)) {
      console.log('_addCalendarEntry: missing parameters object');
      return;
    }
    if (!params.ownerId && !params.ownerEmail) {
      console.log('_addCalendarEntry: either ownerId or ownerEmail parameter required.');
      return;
    }
    var argValidations = [
      {name: 'title', rules:['required', 'nonblank'], type:'string'},
      {name: 'content', rules:['required', 'nonblank'], type:'string'},
      {name: 'start', rules:['required'], type:'date'},
      {name: 'durationType', rules:['required'], type: 'string', enum:['allday', 'timed']},      
      {name: 'applicationId', type:'string'},
      {name: 'componentId', type:'string'},
      {name: 'appConfigData', type: 'object'},

    ];
    if (!checkArguments('_addCalendarEntry', params, cb, argValidations)) return;
    (async () => {
      params.organizationId = app.organizationId;
      var response = await Api().post("calendarmgr/appcreateevent", params);
//      var result = response.data;
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }

  //params: senderId||senderEmail, recipients, subject, message,
	//        organization, applicationId, componentId, appConfigData
  //recipients = [{type:'[to|cc|bcc]', email:'jsmith@widget.com'}]
  methods._queueUserMessageOrTask = ( params, cb ) => {
    var argValidations = [
      {name: 'senderId', type:'string'},
      {name: 'senderEmail', type:'string'},
      {name: 'recipients', rules:['required'], type:'array'},
      {name: 'subject', rules:['required', 'nonblank'], type:'string'},
      {name: 'message', rules:['required', 'nonblank'], type:'string'},
      {name: 'application', type:'object'}
    ];
    if (!checkArguments('_queueUserMessageOrTask', params, cb, argValidations)) return;
    (async () => {
      if (!params.senderId && !params.senderEmail) {
        params.senderId = this.user._id;
      }
      var response = await Api().post('/messagemgr/send', params );
      if (cb) {
        (cb).call(ctx.rootThis, response.data);
      }
    })();
  }

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
  var ctx = {rootThis:null, route:pCtx.route, app:pCtx.app};
  return Vue.component(cCfg.componentId, {
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
      return makeComponent( h, cCfg.uiSchema, ctx );
    },
    beforeCreate() {
      if (cCfg.components) {
        //Should not get here
        ctx.components = Object.assign({},makeDynamicComponents( ctx, cCfg.components ));
      }
      if (this['beforeCreate']) {
        (this['beforeCreate'])();
      }
    },
    created() {
      ctx.rootThis = this;
      this.cloudHavenUserId = this.$store.state.user._id;
      ctx.rootThis._route = ctx.route;
      ctx.rootThis._appParams = deepGet(this.$route, "params.appParams")
      ctx.rootThis._moment = moment;
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
    mp[(cCfg.organizationId||'')+'-'+cCfg.componentId] = makeDynamicComponent( pCtx, cCfg );
    return mp;
  },{})
}
const DynamicUI = Vue.component('DynamicUI', {
  props: {
    uiConfig: { type: Object, required: true },
    app: { type: Object, required: true },
    props: {type: Object}
  },
  vuetify,
  template: '<div id="dynamicUIDiv"></div>',
  mounted() {
    var ctx = {rootThis:null, route:this.$route, app: Object.assign({},this.app)};
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
        dataObj._currentUser = {};
        return dataObj;
      },
      store: this.$store,
      vuetify,
      methods: makeMethods( ctx, this.uiConfig.methods ),
      computed: makeComputed( this.uiConfig.computed ),
      filters: makeFilters( ctx, this.uiConfig.filters ),
      watch: makeComputed( this.uiConfig.watch ),
        render(h) {
        return makeComponent( h, uiSchema, ctx );
      },
      beforeCreate() {
          if (this['beforeCreate']) {
          (this['beforeCreate'])();
        }
        if (components) {
          ctx.components = Object.assign({},makeDynamicComponents( ctx, components ));
        }
      },
      created() {
        ctx.rootThis = this;
        var userId = this.$store.state.user._id;
        this.cloudHavenUserId = userId;
        ctx.rootThis._route = ctx.route;
        ctx.rootThis._currentUser = Object.assign(this.$store.state.user);
        ctx.rootThis._app = ctx.app;
        ctx.rootThis._appParams = deepGet(this.$route, "params.appParams")
        ctx.rootThis._moment = moment;
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

