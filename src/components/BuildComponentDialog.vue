<template>
  <div>
      <v-dialog v-model="componentDialog" @keydown.esc.prevent="componentDialog = false" max-width="800px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>Insert a Component</v-card-title>
        <v-card-text>
          <v-form ref="componentForm">
            <v-select id="componentSelector" v-model="componentSelection" label="Component" :items="componentList" @input="onCompSelect"></v-select>
            <v-select v-model="selectedProps" multiple label="Properties" :items="propsOptions"></v-select>
            <v-select v-model="selectedSlots" multiple label="Slots" :items="slotsOptions"></v-select>
            <v-select v-model="selectedEvents" multiple label="Events" :items="eventsOptions"></v-select>
            <v-select v-model="htmlElementSelection" label="HTML Element" :items="htmlElementList" @input="onHtmlElSelect"></v-select>
            <v-select v-model="addlProperties" multiple label="Additional Properties" :items="properties" @input="onPropsSelection"></v-select>
            <v-card>
              <v-card-subtitle  class="py-0">Dynamic Component</v-card-subtitle>
              <v-card-text class="py-0">
            <v-text-field class="" v-model="componentSearchNameFilter" label="Name Filter" persistent-hint hint="Search for components with this phrase in the name."
              @input="onNameFilterChange"></v-text-field>
            <v-combobox v-model="componentSearchKeywords" :items="allComponentKeywords" label="Search by keyword" multiple chips @input="fetchDynamicComponents"></v-combobox>
            <v-data-table :items="dynamicComponents" :headers="componentHeaders" class="elevation-1">
              <template v-slot:item="{ item }">
                <tr>
                  <td><v-simple-checkbox :ripple="false" v-model="item.selected" @input="onDynamicComponentSelect(item)"></v-simple-checkbox></td>
                  <td>{{ item.organizationName }}</td>
                  <td>{{ item.componentId }}</td>
                  <td><v-btn @click.stop="showDocumentation(item)">Show</v-btn></td>
                </tr>
              </template>
            </v-data-table>
            </v-card-text>
            </v-card>
          </v-form>
          <div>
            {{stringifiedComponent}}
          </div>
        </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="close">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="insert">Insert</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="documentationDialog" @keydown.esc.prevent="componentDialog = false" max-width="900px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>{{documentationItem.componentName}}</v-card-title>
        <v-card-text>
          <span v-html="documentationItem.documentation"></span>
        </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="documentationDialog = false">Close</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import Api from '@/services/Api'
import { EventBus } from '../event-bus.js';
import vcdnUtils from '../_helpers/vcdnutils.js'
import JSON5 from 'json5'
import _ from 'lodash'
export default {
  props: {
    show: Boolean
  },
  data: () => ({
    componentDialog: false,
    componentSearchNameFilter: '',
    allComponentKeywords: [],
    componentSearchKeywords: [],
    dynamicComponents: [],
    dynamicComponentSelection: {organizationId:'', componentId:''},
    documentationDialog: false,
    documentationItem: {},
    addlProperties: [],
    timeoutId: '',
    componentList: [],
    componentSelection:'',
    selectedProps:[],
    selectedSlots:[],
    selectedEvents:[],
    htmlElementList: [],
    htmlElementSelection:'',
    properties: ['attrs', 'class', 'style', 'content', 'ref', 'domProps', 'nativeOn', 'template' ],
    componentHeaders: [
      { text: "Insert", align:'left', sortable:false},
      { text: 'Organization', align: 'left', sortable: true, value: 'organizationName' },
      { text: 'Component', align: 'left', sortable: true, value: 'componentName' },
      { text: "Documentation", align:'left', sortable:false}
    ],
    component: {component:''},
    compMetaData: {
      props:[],
      slots:[],
      events:[]
    }
  }),
  watch: {
    show(show) {
      console.log('show='+show);
      if (show) {
        if (this.allComponentKeywords.length==0) {
          (async () => {
            var response = await Api().get('/organizationcomponent/getcomponentkeywords');
            if (response.data.success) {
              this.allComponentKeywords = response.data.keywords;
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            }
          })();
        }
        this.fetchDynamicComponents();
        this.componentDialog = true;
      } else {
//        this.componentDialog = false;
      }
    }
  },
  mounted() {
    this.componentSelection = '',
    this.htmlElementSelection = '',
    this.dynamicComponentSelection = Object.assign({}, {organizationId:'', componentId:''}),
    this.compMetaData = Object.assign({},{props:[], slots:[], events:[] }),
    this.selectedProps = [],
    this.selectedSlots = [],
    this.selectedEvents = [],
    this.componentSearchNameFilter = '';
    this.allComponentKeywords = [];
    this.componentSearchKeywords = [],
    this.dynamicComponents = [];
    this.componentList = [''].concat(Object.keys(vcdnUtils.uiElementToVueCompMap).sort((a,b)=>(a<b?-1:(a>b?1:0))));
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
      if (this.selectedProps.length>0) {
        component.props = this.selectedProps.reduce((mp,p)=>{mp[p]=""; return mp;},{});
      }
      if (this.selectedSlots.length>0) {
        component.scopedSlots = this.selectedSlots.reduce((mp,p)=>{mp[p]={}; return mp;},{});
      }
      if (this.selectedEvents.length>0) {
        component.on = this.selectedEvents.reduce((mp,p)=>{mp[p]=""; return mp;},{});
      }
      return JSON5.stringify(component, null, 1).replace(/\n/g,"").replace(/,\s*}/g," }");
    }
  },
  methods: {
      onPropsSelection() {
        var obj = _.pick(this.component, ['component', 'organizationId', 'componentId']);
        var propValMap = { //['props', 'attrs', 'class', 'style', 'content', 'scopedSlots', 'on', 'ref', 'domProps', 'nativeOn', 'template' ],
          props: {}, attrs: {}, class:"", style:"", content:[], scopedSlots:{}, on:{}, ref:"", domProps:{}, nativeOn:{}, template:""
        }
        this.addlProperties.forEach(p=>{
          obj[p] = propValMap[p] || "";
        })
        this.component = Object.assign({}, obj);
      },
      onCompSelect() {
        this.htmlElementSelection = '';
        this.dynamicComponentSelection = {organizationId:'', componentId:''};
        this.component = Object.assign({},{component:this.componentSelection});
        this.fetchComponentMetaData();
      },
      fetchComponentMetaData() {
        (async () => {
            var response = await Api().get('/componentmetadata/vuetify/'+this.componentSelection);
            if (response.data.success) {
              this.compMetaData = Object.assign({},_.pick(response.data.metaData, ['props', 'slots', 'events']));
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg);
            }
        })();
      },
      onHtmlElSelect() {
        this.componentSelection = '';
        this.selectedProps = [],
        this.selectedSlots = [],
        this.selectedEvents = [],
        this.compMetaData = Object.assign({},{props:[], slots:[], events:[]});
        this.component = Object.assign({},{component:this.htmlElementSelection});
        this.dynamicComponentSelection = {organizationId:'', componentId:''};
      },
      close() {
        this.componentDialog=false;
        this.$emit('cancel');
      },
      insert() {
        var s = this.stringifiedComponent;
        this.$emit('onSelect', s);
        this.$nextTick(()=>{
          this.componentDialog = false;
        })
      },
      onNameFilterChange() {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
          this.fetchDynamicComponents();
        }, 500);
      },
      onDynamicComponentSelect(item) {
        this.dynamicComponents.forEach(c=>{
          if (c.id != item.id) {
            c.selected = false;
          }
        });
        this.dynamicComponentSelection.organizationId = item.organizationId;
        this.dynamicComponentSelection.componentId = item.componentId;
        this.component.component = 'dynamicComponent';
        this.component.organizationId = item.organizationId;
        this.component.componentId = item.componentId;
        this.htmlElementSelection = '';
        this.componentSelection = '';
      },
      fetchDynamicComponents() {
        (async () => {
          var response = await Api().post('/organizationcomponent/searchcomponents',
            {keywordsFilter: this.componentSearchKeywords, nameFilter: this.componentSearchNameFilter});
          if (response.data.success) {
            var id = 1;
            this.dynamicComponents = response.data.components.map(c=>(Object.assign({id:id++, selected:false}, c)));
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg );
          }
        })();

      },
      showDocumentation(item) {
        this.documentationItem = item;
        this.documentationDialog = true;
      },

  }
}
</script>
