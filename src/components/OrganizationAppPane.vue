<template>
<div id="appDiv">
  <component :is="component" :uiConfig="uiConfig" :app="app"></component>
</div>
</template>

<script>
import DynamicUI from './DynamicUI.js'
import Api from '@/services/Api'
import { VSheet } from 'vuetify/lib'
import { EventBus } from '../event-bus.js';
import vcdnUtils from '../_helpers/vcdnutils.js'

function findExternalComponents( uiSchema, comps ) {
  if (!uiSchema) return;
  if (Array.isArray(uiSchema)) {
    uiSchema.forEach(e=>{
      findExternalComponents( e, comps );
    })
  } else {
    if (uiSchema.component == 'dynamicComponent') {
      comps.push({organizationId:uiSchema.organizationId, componentId:uiSchema.componentId});
    }
    findExternalComponents( uiSchema.contents, comps );
    if (uiSchema.scopedSlots) {
      Object.keys(uiSchema.scopedSlots).forEach(ss=>{
        findExternalComponents( uiSchema.scopedSlots[ss], comps );
      })
    }
  }
}
export default {
  components: {
    DynamicUI, VSheet
  },
  props: {
    application: Object,
    page: String,
    messageOrTask: Object,
    standAlone: {type: Boolean, default: false}
  },
  data() {
    return {
      component: 'VSheet',
      app: {},
      uiConfig:{components:[]},
      mixinWork:[]
    }
  },
  mounted() {
    var app = this.application || this.$route.params.app;
    if (!app) return;
    var pApp = {
      url:app.url,
      organization: {_id:app.organization._id, organizationId:app.organization.organizationId, name: app.organization.name},
      _id: app._id,
      applicationId:app.applicationId,
      name: app.name,
      source:app.source,
      pages:app.pages,
      messageOrTask: app.messageOrTask,
      appConfigData: app.appConfigData||{}
    };
    if (this.messageOrTask) pApp.messageOrTask = this.messageOrTask;
    var page = this.page || this.$route.params.page || 'home';
    pApp.page = page;
    this.app = Object.assign({}, pApp);
    if (app.source == 'CloudHaven') {
      var pageObj = app.pages.find(p=>(p.name==page));
      if (!pageObj) {
        EventBus.$emit('global error alert', `page ${page} not found.`);
        return;
      }
      this.uiConfig = null;
      try {
        this.uiConfig = vcdnUtils.sandboxedStringToJSON(pageObj.content);
      } catch (e) {
        console.log('Home page content syntax error: '+e);
        return;
      }
      if (!this.standAlone && this.uiConfig.appFrame) {
        EventBus.$emit('set app frame', Object.assign(this.app, this.uiConfig.appFrame))
      }
      this.getComponents();
    } else {
      (async () => {
        var response = await Api().post('/organizationapplication/getapppage', {app:pApp, page:page});
        if (response.data.success) {
          this.uiConfig = Object.assign({},response.data.data);
          var errors = vcdnUtils.checkStructure(this.uiConfig, 'page') || [];
          if (errors.length>0) {
            console.log('Errors:\n'+errors.join('\n'));
            EventBus.$emit('global error alert', 'Syntax errors in page (see console log).');
            return;
          }
          if (this.uiConfig.appFrame) {
            EventBus.$emit('set app frame', Object.assign(this.app, this.uiConfig.appFrame))
          }
          this.getComponents();
        } else {
          EventBus.$emit('global error alert', response.data.errMsg);
        }
      })();
    }
  },
  methods: {
    getComponents() {
      if (this.uiConfig.mixins && this.uiConfig.mixins.length>0) {
        var mixinRequests = this.uiConfig.mixins;
        this.uiConfig.mixins = [];
        this.mixinWork.push({mixinRequests:mixinRequests, mixinsTarget:this.uiConfig.mixins})
      }
      var extComps = [];
      findExternalComponents( this.uiConfig.uiSchema, extComps );
      if (extComps) {
        (async () => {
          var response = await Api().post('/organizationcomponent/getcomponents', {status: 'Published', organizationComps:extComps});
          if (response.status==200 && response.data.success) {
            //components and rawComponents(stringSource, organizationId, componentId)
            var components = (this.uiConfig.components || []).concat(response.data.components);
            response.data.rawComponents.forEach(c=>{
              try {
                var uiConfig = vcdnUtils.sandboxedStringToJSON(c.stringContent);
                if (uiConfig) {
                  uiConfig.organizationId = c.organizationId;
                  uiConfig.componentId = c.componentId;
                  components.push(uiConfig);
                }
              } catch(e) {
                console.log(`Org ${c.organizationId} - Component ${c.componentId} error: ${e+''}.`);
              }
            })
            
            var gotErrors = false;
            components.forEach(component =>{
              var errors = vcdnUtils.checkStructure(_.omit(component, ['organizationId', 'componentId']), 'component');
              if (errors) {
                console.log('Component "'+component.componentId+'" errors:\n'+errors.join('\n'));
                gotErrors = true;
              }
            });
            if (gotErrors) {
              EventBus.$emit('global error alert', 'Syntax errors in a component (see console log).');
              return;
            }            
            this.uiConfig.components = components;
            components.forEach(comp=>{
              var mixinRequests = [];
              comp.mixins = comp.mixins||[];
              comp.mixins.forEach(mxn=>{
                if (mxn.mixinId) {
                  mixinRequests.push(mxn);
                }
              });
              if (mixinRequests.length>0) {
                this.mixinWork.push({mixinRequests:mixinRequests, mixinsTarget:comp.mixins});
              }
            })
          }
          this.processMixinWork();
        })();
      } else {
          this.processMixinWork();
      }
    },
    processMixinWork() {
      var mw = this.mixinWork;
      if (this.mixinWork.length==0) {
        this.component = 'DynamicUI';
        return;
      }
      (async () => {
        var allMixinRequests = this.mixinWork.reduce((ar,mw)=>{
          ar = ar.concat(mw.mixinRequests);
          return ar;
        },[]);
        var response = await Api().post('/organizationmixin/getmixins', {status: 'Published', mixinRequests:allMixinRequests});
        if (response.status==200 && response.data.success) {
          //mixinMap and rawMixinMap(stringSource, organizationId, mixinId)
          var mixinMap = response.data.mixinMap;
          var rawMixinMap = response.data.rawMixinMap;
          var gotErrors = false;
          this.mixinWork.forEach(work=>{
            work.mixinRequests.forEach(req=>{
              var key = req.organizationId+':'+req.mixinId;
              var mixin = null;
              if (mixinMap[key]) {
                mixin = mixinMap[key];
              } else if (rawMixinMap[key]) {
                try {
                  mixin = vcdnUtils.sandboxedMixinStringToJSON(rawMixinMap[key]);
                } catch(e) {
                  console.log(`Org ${req.organizationId} - Mixin ${req.mixinId} error: ${e+''}.`);
                }
              }
              var errors = vcdnUtils.checkStructure(mixin, 'mixin');
              if (errors) {
                console.log('Mixin "'+req.mixinId+'" errors:\n'+errors.join('\n'));
                gotErrors = true;
              }
              if (!gotErrors && mixin) {
                work.mixinsTarget.push(mixin);
              }
            })
          })
          
        }
        this.component = 'DynamicUI';
      })();
    }
  }
}
</script>
