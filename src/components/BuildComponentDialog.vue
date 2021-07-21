<template>
  <div>
    <v-dialog v-model="componentDialog" @keydown.esc.prevent="componentDialog = false" max-width="1000px" scrollable overlay-opacity="0.2" @click:outside="close">
      <v-card>
        <v-card-title>Insert a Component</v-card-title>
        <v-card-text>
          <v-form ref="componentForm">
            <v-row class="mt-3 d-flex row justify-space-between">
              <v-col cols="6">
            <v-select id="componentSelector" v-model="componentSelection" label="Component" :items="componentList" @input="onCompSelect" class="mr-4">
              <template v-slot:append>
                <span class="ml-4" v-if="componentSelection=='dynamicComponent'">({{dynamicComponentSelection.organizationId}}, {{dynamicComponentSelection.componentId}})</span>
              </template>
            </v-select>
              </v-col>
              <v-col cols="6">
            <v-select v-model="htmlElementSelection" label="HTML Element" :items="htmlElementList" @input="onHtmlElSelect"></v-select>
              </v-col>
            </v-row>
          <div>
            <b>{{stringifiedComponent}}</b>
          </div>
            <v-expansion-panels v-model="panel">
              <v-expansion-panel v-if="propsOptions.length>0" >
                <v-expansion-panel-header>Props</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-data-table v-model="selectedProps" :headers="propsHeaders" :items="compMetaData.props" show-select selectable-key="name" item-key="name">
                    <template v-slot:item.description="{item}">
                      <span v-html="item.description"/>
                    </template>
                  </v-data-table>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel v-if="slotsOptions.length>0">
                <v-expansion-panel-header>Slots</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-data-table v-model="selectedSlots" :headers="otherHeaders" :items="compMetaData.slots" show-select selectable-key="name" item-key="name">
                    <template v-slot:item.description="{item}">
                      <span v-html="item.description"/>
                    </template>
                  </v-data-table>
                </v-expansion-panel-content>
              </v-expansion-panel>
              <v-expansion-panel v-if="eventsOptions.length>0">
                <v-expansion-panel-header>Events</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-data-table v-model="selectedEvents" :headers="otherHeaders" :items="compMetaData.events" show-select selectable-key="name" item-key="name">
                    <template v-slot:item.description="{item}">
                      <span v-html="item.description"/>
                    </template>
                  </v-data-table>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
            <v-select v-model="addlProperties" multiple label="Additional Properties" :items="properties" @input="onPropsSelection"></v-select>
          </v-form>
        </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="close">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="showDynCompSearchDlg"><v-icon>mdi-magnify</v-icon>Dynamic Component Search</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="insert"><v-icon>mdi-arrow-down</v-icon>Insert</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
    <DynamicComponentSearch :show="showDynamicComponentSearchDlg" @onSelect="onDynamicComponentSelect"/>
  </div>
</template>

<script>
import Api from '@/services/Api'
import { EventBus } from '../event-bus.js';
import vcdnUtils from '../_helpers/vcdnutils.js'
import JSON5 from 'json5'
import _ from 'lodash'
import DynamicComponentSearch from './DynamicComponentSearch'
export default {
  components: {DynamicComponentSearch},
  props: {
    show: Boolean
  },
  data: () => ({
    panel:0,
    showDynamicComponentSearchDlg:false,
    componentDialog: false,
    dynamicComponentSelection: {organizationId:'', componentId:''},
    addlProperties: [],
    timeoutId: '',
    componentList: [],
    componentSelection:'',
    selectedProps:[],
    selectedSlots:[],
    selectedEvents:[],
    htmlElementList: [],
    htmlElementSelection:'',
    properties: ['ref', 'vmodel', 'attrs', 'class', 'style', ':rules', 'domProps', 'nativeOn', 'template' ],
    component: {component:''},
    compMetaData: {
      props:[],
      slots:[],
      events:[]
    },
    propsHeaders: [
      { text: 'Name', align: 'start', sortable: true, value: 'name', width:'150px'},
      { text: 'Type', align: 'start', sortable: true, value: 'dataType' },
      { text: 'Default', align: 'start', sortable: true, value: 'defaultValue' },
      { text: 'Description', align: 'start', sortable: true, value: 'description' }
    ],
    otherHeaders: [
      { text: 'Name', align: 'start', sortable: true, value: 'name'},
      { text: 'Description', align: 'start', sortable: true, value: 'description' }
    ]
  }),
  watch: {
    show(val) {
      if (val) {
        this.panel = 0;
        this.resetComponent();
        this.componentDialog = true;
        this.componentSelection = '';
        this.component = {component:''};
        this.includeRef = false;
        this.addlProperties = [];
      }
    }
  },
  mounted() {
    this.componentList = [''].concat((['dynamicComponent'].concat(Object.keys(vcdnUtils.uiElementToVueCompMap)).sort((a,b)=>(a<b?-1:(a>b?1:0)))));
    this.htmlElementList = [''].concat(vcdnUtils.validHtmlTags);
  },
  computed: {
    propsOptions() {
      return this.compMetaData.props.map(p=>(p.name))
    },
    slotsOptions() {
      return this.compMetaData.slots.map(p=>(p.name))
    },
    eventsOptions() {
      return this.compMetaData.events.map(p=>(p.name))
    },
    stringifiedComponent() {
      var component = Object.assign({},this.component);
      var saveContents = this.component.contents;
      delete component.contents;
      if (this.selectedProps.length>0) {
        component.props = this.selectedProps.reduce((mp,prop)=>{
          var propInfo = this.getPropInfo(prop);
          mp[propInfo.property] = propInfo.defaultValue;
          return mp;
        },{});
      }
      if (this.selectedSlots.length>0) {
        var selectedSlotsNames = this.selectedSlots.map(p=>(p.name));
        if (component.scopedSlots) {
          delete component.scopedSlots;
        }
        var defaultIndex = selectedSlotsNames.indexOf('default');
        if (defaultIndex>=0) {
          selectedSlotsNames.splice(defaultIndex, 1);
          component.contents = component.contents || [];
        }
        if (selectedSlotsNames.length>0) {
          component.scopedSlots = selectedSlotsNames.reduce((mp,p)=>{mp[p]={}; return mp;},{});
        }
      }
      if (this.selectedEvents.length>0) {
        var selectedEventsNames = this.selectedEvents.map(e=>e.name);
        component.on = selectedEventsNames.reduce((mp,p)=>{mp[p]=""; return mp;},{});
      }
      component.contents = saveContents;
      return JSON5.stringify(component, null, 1).replace(/\n/g,"").replace(/,\s*}/g," }");
    }
  },
  methods: {
    getPropInfo(prop) {
      var defaultValue = "";
      var property = prop.name;
      if (prop.dataType == 'function' || prop.dataType.indexOf('array')>=0 || prop.dataType.indexOf('object')>=0 ||
        prop.dataType.indexOf('[]')>=0 || prop.dataType == 'DataOptions') {
        defaultValue = "";
        property = ":"+prop.name;
      } else if (prop.dataType.indexOf('string')>=0) {
        defaultValue = "";
      } else if (prop.dataType == 'boolean') {
        defaultValue = prop.defaultValue=='false'?true:false;
      } else if (prop.dataType == 'number') {
        defaultValue = prop.defaultValue;
      } else if (prop.dataType == 'any') {
        if (prop.defaultValue=='false') {
          defaultValue = false;
        } else if (prop.dataType== 'true') {
          defaultValue = true;
        } else {
          defaultValue = "";
        }
      } else {
        defaultValue = "";
      }
      if (defaultValue=='undefined') defaultValue = "";
      return {property, defaultValue};
    },
    resetComponent(selectionToKeep) {
      this.showDynamicComponentSearchDlg = false;
      this.selectedProps = [];
      this.selectedSlots = [];
      this.selectedEvents = [];
      if (selectionToKeep=='htmlElement') this.componentSelection = '';
      if (selectionToKeep!='htmlElement') this.htmlElementSelection = '';
      if (selectionToKeep != 'dynamicComponentSelection') this.dynamicComponentSelection = Object.assign({}, {organizationId:'', componentId:''});
      this.compMetaData = Object.assign({},{props:[], slots:[], events:[] });
    },
      onPropsSelection() {
        var obj = _.pick(this.component, ['component', 'organizationId', 'componentId']);
        var propValMap = { //['props', 'attrs', 'class', 'style', 'contents', 'scopedSlots', 'on', 'ref', 'domProps', 'nativeOn', 'template' ],
          "vmodel":"", props: {}, attrs: {}, class:"", style:"", ":rules":"[]", contents:[], scopedSlots:{}, on:{}, ref:"", domProps:{}, nativeOn:{}, template:""
        }
        this.addlProperties.forEach(p=>{
          obj[p] = obj[p] || propValMap[p] || "";
        })
        this.component = Object.assign({}, obj);
      },
      onCompSelect() {
        this.resetComponent('component');
        this.component = Object.assign({},{component:this.componentSelection+'', contents:[]});
        if (this.componentSelection == 'dynamicComponent') {
          this.showDynCompSearchDlg();
        } else {
          this.fetchComponentMetaData();
        }
      },
      showDynCompSearchDlg() {
          this.componentSelection = '';
          this.showDynamicComponentSearchDlg = true;
          setTimeout(()=>{
            this.showDynamicComponentSearchDlg = false;
          }, 2000);
      },
      fetchComponentMetaData() {
        (async () => {
          var componentKey = _.replace(_.kebabCase(this.componentSelection), '-', '_');
            var response = await Api().get('/componentmetadata/vuetify/'+componentKey);
            if (response.data.success) {
              this.compMetaData = Object.assign({props:[], slots:[], events:[]},_.pick(response.data.metaData, ['props', 'slots', 'events']));
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg);
            }
        })();
      },
      onHtmlElSelect() {
        this.resetComponent('htmlElement');
        this.component = Object.assign({},{component:this.htmlElementSelection});
      },
      close() {
        this.componentDialog=false;
        this.$emit('onSelect', '');
      },
      insert() {
        var s = this.stringifiedComponent;
        this.$emit('onSelect', s);
        this.$nextTick(()=>{
          this.componentDialog = false;
        })
      },
      onDynamicComponentSelect(item) {
        this.componentSelection = 'dynamicComponent';
        this.resetComponent( 'dynamicComponentSelection' );
        this.compMetaData = Object.assign({props:[], slots:[], events:[]}, _.pick(item, ['props', 'slots', 'events']));
        this.dynamicComponentSelection = Object.assign({}, _.pick(item, ["organizationId", "componentId"]));
        this.componentSelection = 'dynamicComponent';
        this.component = Object.assign({},{component:'dynamicComponent', organizationId: item.organizationId, componentId:item.componentId});
        this.$forceUpdate();
      }
  }
}
</script>
