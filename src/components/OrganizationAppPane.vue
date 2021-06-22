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
  }
}
export default {
  components: {
    DynamicUI, VSheet
  },
  props: {
    application: Object,
    page: String
  },
  data() {
    return {
      component: 'VSheet',
      app: {},
      uiConfig:{components:[]}
    }
  },
  mounted() {
    var app = this.application || this.$route.params.app;
    if (!app) return;
    var pApp = {url:app.url, organizationId: app.organizationId, _id: app._id, applicationId:app.applicationId,source:app.source, pages:app.pages};
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
      if (this.uiConfig.appFrame) {
        EventBus.$emit('set app frame', Object.assign(this.app, this.uiConfig.appFrame))
      }
      this.getComponents();
    } else {
      (async () => {
        var response = await Api().post('/organizationapplication/getapppage', {app:pApp, page:page});
        if (response.data.success) {
          this.uiConfig = Object.assign({},response.data.data);
          var errors = vcdnUtils.checkStructure(this.uiConfig) || [];
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
              var errors = vcdnUtils.checkStructure(component, true);
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
          }
          this.component = 'DynamicUI';
        })();
      } else {
          this.component = 'DynamicUI';
      }
    }
  }
}
</script>
