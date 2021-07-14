<template>
  <div>
    <v-alert type="error" v-if="srcParseErrMsg" :value="srcParseErrMsg"/>
    <v-treeview :items="rootNodes" elevation="2" dense class="mt-3" activatable :open="open" :active="active" hoverable @update:active="onActivated">
      <template v-slot:label="{ item, active }">
        <div v-if="item.root=='dataModel'">
          <span >{{item.name}}{{item.value?(' : '+item.value):''}}
            <v-icon v-if="canHaveChild(item)" @click.stop="addPropertyDlg(item)">mdi-plus-thick</v-icon>
            <v-icon v-if="item.level>0 && item.name" @click.stop="editPropertyDlg(item)">mdi-pencil</v-icon>
            <v-icon @click.stop="deleteItem(item)" class="ml-2">mdi-trash-can</v-icon>
          </span>
          <v-sheet v-if="propDialog && active" elevation="1" width="300px" max-width="300px">
            <v-form ref="propForm" v-model="propFormValid">
            <div class="d-flex justify-left mb-2">
              <v-text-field :id="propObj.id" label="Property" single-line dense v-model="propObj.name" :rules="[rules.required, rules.validPropName]"
                @keyup.enter.prevent="saveProperty" @click.stop=""></v-text-field>
              <span v-if="canHavePropertyValue" class="mx-2 pb-0 pt-1"> <b>:</b> </span>
              <v-text-field v-if="canHavePropertyValue" label="Value" persistent-hint hint="(optional)" single-line dense v-model="propObj.value" 
                :rules="[rules.validPropValue]" @keyup.enter.prevent="saveProperty" @click.stop=""></v-text-field>
                <v-btn icon @click.native.stop="saveProperty"><v-icon>mdi-content-save</v-icon></v-btn>
                <v-btn icon @click.native="propDialog=false"><v-icon>mdi-close-thick</v-icon></v-btn>{{propObj.name?'':setFocus(propObj.id)}}
            </div>
            </v-form>
          </v-sheet>
        </div>
        <div v-else-if="isFunctionType(item.root)">
          <span>{{item.name}}
            <v-icon v-if="canHaveChild(item)" @click.stop="addFunctionDlg(item)">mdi-plus-thick</v-icon>
            <v-icon v-if="item.level>0 && item.name" @click.stop="editFunctionDlg(item)">mdi-pencil</v-icon>
            <v-icon @click.stop="deleteItem(item)" class="ml-2">mdi-trash-can</v-icon>
          </span>
        </div>
        <div v-else-if="item.root=='mixins'">
          <span v-if="!active || item.id==item.root">{{item.name}}</span>
          <v-form v-else style="max-width:250px">
            </v-form>
        </div>
        <div v-else-if="item.root=='uiSchema'">
          <span >{{item.isSlot?'<':''}}{{item.name}}{{item.isSlot?'>':''}}
            <v-icon v-if="canHaveChild(item)" @click.stop="addComponentDlg(item)">mdi-plus-thick</v-icon>
            <v-icon v-if="item.level>0 && item.name" class="ml-2" @click.stop="item.isSlot?editSlotDlg(item):editComponentDlg(item)">mdi-pencil</v-icon>
            <v-btn v-if="item.level>0 && !item.isSlot && !isHtmlElement(item.name)" x-small class="ml-2" elevation="1" @click.stop="addSlotDlg(item)"><v-icon small>mdi-plus</v-icon>slot</v-btn>
            <v-icon @click.stop="deleteItem(item)" class="ml-2">mdi-trash-can</v-icon>
          </span>
          <v-sheet v-if="slotDialog && active" elevation="1" width="300px" max-width="300px">
            <v-form ref="slotForm" v-model="slotFormValid">
            <div class="d-flex justify-left mb-2">
              <v-text-field :id="slotObj.id" label="Slot" single-line dense v-model="slotObj.name" :rules="[rules.required, rules.validPropName]" @keyup.enter.prevent="saveSlot" @click.stop=""></v-text-field>
                <v-btn icon @click.native.stop="saveSlot()"><v-icon>mdi-content-save</v-icon></v-btn>
                <v-btn icon @click.native="slotDialog=false"><v-icon>mdi-close-thick</v-icon></v-btn>{{slotObj.name?'':setFocus(slotObj.id)}}
            </div>
            </v-form>
          </v-sheet>
        </div>
      </template>
    </v-treeview>
    <v-dialog v-model="clientFuncSelectDialog" @keydown.esc.prevent="clientFuncSelectDialog = false" max-width="500px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>Available Functions</v-card-title>
        <v-card-text>
          <v-form ref="clientFuncForm">
            <v-select v-model="clientFunction" label="Selection " :items="clientFunctions" @change="onClientFunctionSelect" persistent-hint hint="Select a client function or component to insert."></v-select>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="funcDialog" @keydown.esc.prevent="funcDialog = false" overlay-opacity="0.2" elevation="3" retain-focus>
      <v-card>
        <v-card-title>{{funcObj.title}}</v-card-title>
        <v-card-text>
          <v-form ref="funcForm" @click.stop=""  v-model="valid" lazy-validation >
            <v-text-field id="funcName" style="width:300px" dense v-model="funcObj.name" label="Name" :rules="[rules.required, rules.validFuncName]" @click.stop="" ></v-text-field>
            <v-sheet v-if="editedItem.root=='methods' || editedItem.root=='watch' || editedItem.root=='filters'" elevation="1" class="justify-left">
            <v-text-field v-if="editedItem.root=='methods'" style="max-width:300px;" label="Arguments" class="mr-2" placeholder="Enter a new argument." persistent-hint hint="Enter an argument name and then press Enter." v-model="funcObj.newArg" @click.stop=""
              :rules="[rules.validArgument]" @keyup.enter.prevent="checkArgument"></v-text-field>
            <div v-if="editedItem.root=='watch'">Arguments</div>
            <v-chip-group column>
              <v-chip v-for="arg in funcObj.arguments" :key="arg" style="display:inline-block" class="ma-0" :close="editedItem.root=='methods'"
                @click:close="funcObj.arguments.splice(funcObj.arguments.indexOf(arg),1)">{{arg}}</v-chip>
            </v-chip-group>
            </v-sheet>
            <prism-editor class="my-editor mt-2" v-model="funcObj.body" :highlight="highlighter" line-numbers :rules="[rules.required, rules.validFuncBody]" @input="onPageChange"></prism-editor>
            {{setFocus('funcName')}}
            <v-alert type="error" v-if="bodyErrMsg">{{bodyErrMsg}}</v-alert>
            <!--v-textarea rows="4" auto-grow label="Body" v-model="funcObj.body" @click.stop="" :rules="[rules.required, rules.validFuncBody]"></v-textarea-->
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native="saveFunction()"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="compDialog" width="600px" @keydown.esc.prevent="compDialog = false" overlay-opacity="0.2" elevation="3" retain-focus>
      <v-card>
        <v-card-title>{{compObj.title}}</v-card-title>
        <v-card-text>
          <v-form ref="compForm" @click.stop=""  v-model="valid" lazy-validation >
            <v-select id="componentSelector" v-model="componentSelection" label="Component" :items="componentList" @input="onCompSelect"></v-select>
            <v-select v-model="htmlElementSelection" label="HTML Element" :items="htmlElementList" @input="onHtmlElSelect"></v-select>
            <v-textarea class="mt-2" rows="4" auto-grow v-model="compObj.properties" label="Properties" :rules="[rules.required, rules.validCompProps]"></v-textarea>
            <v-text-field v-if="compObj.dynamicComponent.componentId" dense label="Oeganization Id" :value="compObj.dynamicComponent.organizationId" readonly />
            <v-text-field v-if="compObj.dynamicComponent.componentId" dense label="Component Id" :value="compObj.dynamicComponent.componentId" readonly />
            {{setFocus( 'componentSelector' )}}
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native="compDialog=false">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native="saveComponent()"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <ComponentSelectDialog :show="componentSelectDialog" @onSelect="insertComponent" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import vcdnUtils from '../_helpers/vcdnutils.js'
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles
import ComponentSelectDialog from './ComponentSelectDialog'
import JSON5 from 'json5'
import _ from 'lodash'

function validateFunction( body, argList) {
  var partsList = argList?argList.concat([body]):[body];
  try {
    Function.apply( null, partsList);
    return null;
  } catch (e) {
    return e+'';
  }
}

  export default {
    components: { PrismEditor, ComponentSelectDialog },
    props: {
      type: String,
      source: String
    },
    data: () => ({
      propertyDlg: false,
      propObj:{editMode:'add', name:'', value:'', children:[]},
      funcObj:{editMode:'add', title:'', parent:{}, newArg:'', name:'', arguments:[], body:''},
      funcDialog: false,
      propDialog: false,
      valid: true,
      propFormValid: true,
      clientFuncSelectDialog: false,
      clientFunctions: [],
      clientFunction:'',
      bodyErrMsg:'',
      compDialog:false,
      slotDialog: false,
      slotObj: {editMode:'add', isSlot:true, id:'', name:'', children:[]},
      slotFormValid: true,
      compFormValid:true,
      compObj:{editMode:'add', title:'', id:'', name:'', properties:'', children:[], dynamicComponent:{}},
      rules: {
          required: value => !!value || 'Required.',
          validPropName: value => !value || /^[a-zA-Z$_][a-zA-Z0-9$_-]*$/.test(value) || 'Invalid property name.',
          validPropValue: value => {
            if (!value) return true;
            var result = validateFunction(value)
            return result === null? true: result;
          },
          validArgument: value => !value || /^[a-zA-Z$_][a-zA-Z0-9$_-]*$/.test(value) || 'Invalid argument name.',
          validFuncName: value => !value || /^[a-zA-Z][a-zA-Z0-9$_-]*$/.test(value) || 'Invalid function name.',
          validFuncBody: value => {
            if (!value) return true;
            var result = validateFunction( value );
            return result === null? true: result;
          },
          validCompProps: value => {
            if (!value) return true;
            var result = validateFunction( 'var x = ' + value );
            return result === null? true: result;
          }
      },
      editedItem: {},
      rootNodes:[],
      active: [],
      open:[],
      componentList: [],
      componentSelection:'',
      htmlElementList: [],
      htmlElementSelection:'',
      componentSelectDialog: false,
      dynCompKey: 1,
      wasChanged: false,
      srcParseErrMsg:''
    }),
    mounted () {
      this.clientFunctions = Object.keys(vcdnUtils.clientFunctionMap);
      debugger;
      var rootNodes = this.parseSource(this.source);
/*      var items = [
        this.rootNode('dataModel'),
        this.rootNode('methods'),
        this.rootNode('computed'),
        this.rootNode('watch'),
        this.rootNode('filters'),
      ]
      if (this.type == 'Component') {
        items.unshift(this.rootNode('props'));
        items.push(this.rootNode('mixins'));
        items.push(this.rootNode('uiSchema'));
      } else if (this.type == 'Application') {
        items.push(this.rootNode('mixins'));
        items.push(this.rootNode('uiSchema'));
      }*/
      this.rootNodes = rootNodes; //items;
      this.componentList = [''].concat(Object.keys(vcdnUtils.uiElementToVueCompMap).sort((a,b)=>(a<b?-1:(a>b?1:0))).concat(['dynamicComponent']));
      this.htmlElementList = [''].concat(vcdnUtils.validHtmlTags);
      this.wasChanged = false;
    },
    computed: {
      json() {
        var j = {};
        this.rootNodes.forEach(rn=>{
          j[rn.name] = {};
          if (rn.name=='dataModel') {
            rn.children.forEach(dmChild=>{
              this.dataModelToJson(j.dataModel, dmChild);
            });
          } else if (this.isFunctionType(rn.root)) {
            rn.children.forEach(fNode=>{
              this.functionToJson( j[rn.name], fNode);
            })
          } else if (rn.name=='uiSchema') {
            if (rn.children && rn.children.length>0) {
              var node = (rn.children.length>1)?{name:'div', contents:rn.children}:rn.children[0]
              j[rn.name] = this.uiSchemaToJson( node );
            }
          }
        });
        return JSON5.stringify(j, null, 2);
      },
      canHavePropertyValue() {
        return this.propObj.editMode == 'add' || this.editedItem.children.length==0;
      },
      ...mapState(['user'])
    },
    watch: {
      json( val ) {
        this.$emit('changed', val);
      }
    },
    methods: {
      parseSource( src ) {
        var o = null;
        this.srcParseErrMsg = '';
/*        var testObj = {
          dataModel:{
            aaa: {
              bbb: {
                ccc: "new Date()"
              },
              ddd: "true"
            },
            eee:"[]"
          },
          methods: {
            test: {
              args:["aaa", "bbb"],
              body:`
              var x = 1234;
              var y = 5678;
              `
            },
            test2: {
              args:["aaa2", "bbb2"],
              body:`
              var x = 21234;
              var y = 25678;
              `
            }
          },
          computed: {
            theVal: {
              body:`
              return 1234;
              `
            }
          },
          watch: {
            someVal: {
              args:["newVal", "oldVal"],
              body:`
                this.doSomething();
              `
            }
          },
          filters: {
            f: {
              args: ["val"],
              body:`
              return '['+val+']';
              `
            }
          }
        }*/
        try {
          o = /*testObj;*/ (Function.apply( null, [src+' return uiConfig;']))();
          debugger;
        } catch (e) {
          debugger;
          this.srcParseErrMsg = "Source error: "+e;
          return;
        }
        debugger;
        var rootNodes = Object.keys(o).reduce((ar,k)=>{
          var node = this.rootNode(k);
          ar.push(node);
          if (node.name == 'dataModel') {
            this.parseDataModel(node, o[k], 0, {curId:this.initId()});
          } else if (this.isFunctionType(node.name)) {
            debugger;
            this.parseFunction(k, node, o[k], 0, {curId:this.initId()});
          } else if (node.name=='uiSchema') {

          }
          return ar;
        },[]);
        return rootNodes;
      },
      parseFunction(root, node,  obj, level, ctx ) {
        level = level+1;
        Object.keys(obj).forEach(k=>{
          ctx.curId++
          var funcObj = obj[k];
          var childNode = {id:ctx.curId, name:k, arguments:funcObj.args, body:funcObj.body, root:root, level:level};
          node.children.push(childNode);
        })
      },
      parseDataModel(node,  obj, level, ctx ) {
        level = level+1;
        if ((typeof obj)=='object' && !Array.isArray(obj)) {
          Object.keys(obj).forEach(k=>{
            ctx.curId++
            var childNode = {id:ctx.curId, name:k, root:'dataModel', level:level, children:[]};
            node.children.push(childNode);
            this.parseDataModel(childNode, obj[k], level, ctx)
          })
        } else {
          node.value = obj;
        }
      },
      isHtmlElement(el) {
        return this.htmlElementList.indexOf(el)>=0;
      },
      makeComponent( node ) {
        var comp = {component:node.name};
        if (node.oranizationId && node.componentId) {
          comp.oranizationId = node.oranizationId;
          comp.componentId = node.componentId;
        }
        var propsObj = null;
        try {
          propsObj = JSON5.parse(node.properties);
        } catch (e) {
          propsObj = {properties_parse_error:e+''};
        }
        return Object.assign(comp, propsObj);
      },
      uiSchemaToJson( node) {
        var j = this.makeComponent( node );
        if (node.children && node.children.length>0) {
          var contents = node.children.filter(c=>(!c.isSlot));
          if (contents.length>0) {
            j.contents = contents.reduce((ar, c)=>{
              ar.push(this.uiSchemaToJson(c));
              return ar;
            },[]);
          }
          var slots = node.children.filter(c=>(c.isSlot));
          if (slots.length>0) {
            j.scopedSlots = {};
            slots.forEach(s=>{
              j.scopedSlots[s.name] = (s.children||[]).reduce((ar,c)=>{
                ar.push(this.uiSchemaToJson(c))
                return ar;
              },[]);
              if (j.scopedSlots[s.name].length==0) {
                j.scopedSlots[s.name] = {}
              } else if (j.scopedSlots[s.name].length==1) {
                j.scopedSlots[s.name] = j.scopedSlots[s.name][0];
              }
            })
          }
        }
        return j;
      },
      functionToJson( json, node) {
        json[node.name] = {};
        if (node.arguments && node.arguments.length>0) {
          json[node.name].args = node.arguments;
        }
        json[node.name].body = node.body;
      },
      dataModelToJson( json, node) {
        json[node.name] = node.value?node.value:{};
        if (node.children.length>0 && !node.value) {
          node.children.forEach(chNode=>{
            this.dataModelToJson( json[node.name], chNode);
          })
        }
      },
      onCompSelect() {
        this.componentSelectDialog = false;
        this.compObj.name = this.componentSelection;
        this.htmlElementSelection = '';
        if (this.compObj.name == 'dynamicComponent') {
          this.componentSelectDialog = true;
          this.dynCompKey = this.dynCompKey+1;
          this.$forceUpdate();
        } else {
          this.compObj.dynamicComponent = {};
        }
      },
      onHtmlElSelect() {
        this.componentSelection = '';
        this.compObj.name = this.htmlElementSelection;
      },
      insertComponent(item) {
        this.compObj.dynamicComponent = item;
        this.componentSelectDialog = false;
      },
      sortChildren( item ) {
        item.children = item.children.sort((a,b)=>{
          var aS = a.isSlot?0:1;
          var bS = b.isSlot?0:1;
          var aN = a.name.toLowerCase();
          var bN = b.name.toLowerCase();
          return aS<bS?-1:(aS>bS?1:(aN<bN?-1:(aN>bN?1:0)))
        })
      },
      resetValidation( formName ) {
        this.$nextTick(()=>{
          this.$refs[formName].resetValidation();
        })
      },
      isActive(id) {
        return this.active.length==1 && this.active[0]==id;
      },
      onClientFunctionSelect( clientFunction ) {
        if (clientFunction) {
          var script = vcdnUtils.clientFunctionMap[clientFunction];
          if (script) {
            this.funcObj.body = this.funcObj.body.replace('%%%', script);
            this.clientFunction = '';
          }
        }
        this.clientFuncSelectDialog = false;
      },
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      onPageChange( value ) {
        var found = value.indexOf('%%%')>=0;
        if (found) {
          this.clientFuncSelectDialog = true;
        }
      },
      onClickOutside( event ) {
        console.log('got click outside: '+JSON.stringify(e));
        return false;
      },
      setFocus( id ) {
        this.$nextTick(()=>{
          var el = document.getElementById(id);
          if (el) {
            el.focus();
          } else {
            setTimeout(()=>{
              var el = document.getElementById(id);
              if (el) {
                el.focus();
              }
            }, 2000);
          }
        })
        return '';
      },
      canHaveChild( item ) {
        return (
          (item.root == 'dataModel' && !item.value) ||
          (this.isFunctionType(item.root) && item.level==0) ||
          (item.root == 'uiSchema')
        )
      },
      checkArgument() {
        if (!this.funcObj.newArg || !/^[a-zA-Z$_-][a-zA-Z0-9$_-]*$/.test(this.funcObj.newArg)) return;
        this.funcObj.arguments.push(this.funcObj.newArg);
        this.funcObj.newArg = '';
      },
      rootNode(name) {
        return {id:name+'', name:name+'', children:[], root:name+'', level:0, value:''};
      },
      initId() {
        return (new Date().getTime())+'';
      },
      isFunctionType( key ) {
        return ['methods', 'computed', 'watch', 'filters'].indexOf(key)>=0;
      },
      addPropertyDlg(parent) {
        this.propObj.editMode = 'add';
        this.active = [parent.id+''];
        this.propObj.activeId = parent.id;
        this.propObj.id = 'prop_'+this.initId();
        this.propObj.title  = `New ${(parent.name.charAt(parent.name.length-1)=='s')?parent.name.substring(0, parent.name.length-1):parent.name} property`;
        this.propObj.parent = parent;
        this.propObj.name = '';
        this.propObj.value = '';
        this.propDialog = true;
        this.resetValidation( 'propForm' );
      },
      editPropertyDlg(item) {
        this.editedItem = item;
        this.active = [item.id+''];
        this.propObj.activeId = item.id;
        this.propObj.editMode = 'edit';
        this.propObj.title  = `Edit property ${item.name}`;
        this.propObj.name = item.name;
        this.propObj.value = item.value;
        this.propDialog = true;
      },
      saveProperty() {
        if (!this.$refs.propForm.validate()) return;
        if (this.propObj.editMode == 'add') {
          this.open.push(this.propObj.parent.id);
          var id = this.initId();
          this.propObj.parent.children.push(Object.assign({},
            { id:id,
            value:this.propObj.value,
            name:this.propObj.name,
            root:this.propObj.parent.root,
            level:this.propObj.parent.level+1,
            children:[]
            }
          ));
          this.sortChildren( this.propObj.parent );
          this.active = [id+''];
        } else {
          this.editedItem.name = this.propObj.name;
          this.editedItem.value = this.propObj.value;
        }
        this.wasChanged = true;
        this.propDialog = false;
      },
      addFunctionDlg(parent) {
        this.editedItem = parent;
        this.active = [parent.id+''];
        this.funcObj.activeId = parent.id;
        this.bodyErrMsg = '';
        this.funcObj.editMode = 'add';
        this.funcObj.title  = `New ${(parent.name.charAt(parent.name.length-1)=='s')?parent.name.substring(0, parent.name.length-1):parent.name}`;
        this.funcObj.parent = parent;
        this.funcObj.name = '';
        this.funcObj.arguments = parent.root=='watch'?["newVal", "oldVal"]:(parent.root=='filters'?["value"]:[]);
        this.funcObj.body = '';
        this.funcDialog = true;
        this.resetValidation( 'funcForm' );
      },
      editFunctionDlg(item) {
        this.active = [item.id+''];
        this.funcObj.activeId = item.id;
        this.editedItem = item;
        this.bodyErrMsg = '';
        var type = (item.root.charAt(item.root.length-1)=='s')?item.root.substring(0, item.root.length-1):item.root;
        this.funcObj.editMode = 'edit';
        this.funcObj.title  = `Edit ${type} ${item.name}`;
        this.funcObj.name = item.name;
        this.funcObj.arguments = item.arguments;
        this.funcObj.body = item.body;
        this.funcDialog = true;
      },
      saveFunction() {
        if (!this.$refs.funcForm.validate()) return;
        var result = this.rules.validFuncBody(this.funcObj.body);
        this.bodyErrMsg = result===true?'':result;
        if (this.bodyErrMsg) return;
        if (this.funcObj.editMode == 'add') {
          this.open.push(this.funcObj.parent.id);
          var id = this.initId();
          this.funcObj.parent.children.push(Object.assign({},{id:id, arguments:this.funcObj.arguments, body:this.funcObj.body, name:this.funcObj.name, root:this.funcObj.parent.root, level:this.funcObj.parent.level+1}));
          this.sortChildren( this.funcObj.parent );
          this.active = [id+''];
        } else {
          this.editedItem.title = this.funcObj.title;
          this.editedItem.arguments = this.funcObj.arguments;
          this.editedItem.body = this.funcObj.body;
        }
        this.wasChanged = true;
        this.funcDialog = false;
      },
      addComponentDlg(parent) {
        this.editedItem = parent;
        this.active = [parent.id+''];
        this.componentSelection = '';
        this.htmlElementSelection = '';
        this.compObj = {name:'', properties:
`{
  props:{},
  vmodel:'',
  class:'',
  on:{}
}`, dynamicComponent:{}};
        this.compObj.editMode = 'add';
        this.compObj.parent = parent;
        this.compDialog = true;
        this.resetValidation( 'compForm' );
      },
      editComponentDlg(item) {
        this.componentSelectDialog = false;
        this.editedItem = item;
        this.active = [item.id+''];
        this.compObj.activeId = item.id;
        this.compObj.editMode = 'edit';
        this.compObj.title  = `Edit ${item.name}`;
        this.compObj.dynamicComponent = item.dynamicComponent;
        this.componentSelection = this.componentList.indexOf(this.compObj.name)>=0?this.compObj.name:'';
        this.htmlElementSelection = this.isHtmlElement(this.compObj.name)?this.compObj.name:'';
        this.compDialog = true;
      },
      saveComponent() {
        if (!this.$refs.compForm.validate()) return;
        if (!this.compObj.name) {
          alert('Please select either a component or an HTML ELement.');
          return;
        }
        if (this.compObj.editMode == 'add') {
          this.open.push(this.compObj.parent.id);
          var id = this.initId();
          this.compObj.parent.children.push(Object.assign({}, 
              { id:id,
                name:this.compObj.name,
                properties:this.compObj.properties,
                root:this.compObj.parent.root,
                level:this.compObj.parent.level+1,
                children:[],
                dynamicComponent: this.compObj.dynamicComponent}));
          this.sortChildren( this.compObj.parent );
          this.active = [id+''];
        } else {
          if (this.compObj.name=='dynamicComponent') {
            this.editedItem.organizationId = this.compObj.organizationId;
            this.editedItem.componentId = this.compObj.componentId;
          }
          this.editedItem.name = this.compObj.name
          this.editedItem.title = this.compObj.title;
          this.editedItem.properties = this.compObj.properties;
        }
        this.dynCompKey = this.dynCompKey+1;
        this.wasChanged = true;
        this.compDialog = false;
      },
      addSlotDlg( parent ) {
        this.active = [parent.id+''];
        this.slotObj.editMode = 'add';
        this.slotObj.id = 'prop_'+this.initId();
        this.slotObj.name = '';
        this.slotObj.parent = parent;
        this.slotDialog = true;
        this.resetValidation( 'slotForm' );
      },
      editSlotDlg(item) {
        this.editedItem = item;
        this.active = [item.id+''];
        this.slotObj.editMode = 'edit';
        this.slotObj.name = item.name;
        this.slotDialog = true;
      },
      saveSlot() {
        if (!this.$refs.slotForm.validate()) return;
        if (this.slotObj.editMode == 'add') {
          this.open.push(this.slotObj.parent.id);
          var id = this.initId();
          this.slotObj.parent.children.push(Object.assign({},
              { id:id,
                isSlot:true,
                name:this.slotObj.name,
                root:this.slotObj.parent.root,
                level:this.slotObj.parent.level+1,
                children:[]
              }
          ));
          this.sortChildren( this.slotObj.parent );
          this.active = [id+''];
        } else {
          this.editedItem.name = this.slotObj.name;
        }
        this.wasChanged = true;
        this.slotDialog = false;
      },
      findParentInBranch( node, id ) {
        if (!node || !node.children) return null;
        var index = node.children.findIndex(c=>(c.id==id));
        if (index>=0) return node;
        for (var i=0;i<node.children.length;i++) {
          var c = node.children[i];
          var foundNode = this.findParentInBranch(c, id);
          return foundNode;
        }
        return null;
      },
      deleteItem( item ) {
        if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
        this.wasChanged = true;
        if (item.level==0) {
          var index = this.rootNodes.findIndex(n=>(n.id=item.id));
          this.rootNodes.splice(index,1);
        } else {
          for (var i=0;i<this.rootNodes.length;i++) {
            var rootNode = this.rootNodes[i];
            var node = this.findParentInBranch(rootNode, item.id);
            if (node) {
              var index = node.children.findIndex(n=>(n.id=item.id));
              node.children.splice(index,1);
              return;
            }
          }
        }
      },
      deactivate( item ) {
        this.active = [];
      },
      onActivated( activeItems ) {
        this.active = activeItems;
      },
      cancel() {
        this.funcDialog = false;
      },
      close () {
        setTimeout(() => {
        }, 300)
      },
      saveIt () {
        if (!this.$refs.theForm.validate()) return;
        (async () => {
/*          var response = await Api().post('/messagemgr/send', 
            {sender: this.user._id, recipients:recipients, subject: this.message.subject, message: this.message.message});*/
          this.funcDialog = false;
          if (response.data.success) {
            EventBus.$emit('global success alert', '');
          }
        })();
      }
    }
  }
</script>

<style>
  /* required class */
  .my-editor {
    /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
    background: #1e1e1e;
    color: #9cdcf0;
 
    /* you must provide font-family font-size line-height. Example: */
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
  }
 
  /* optional class for removing the outline */
  .prism-editor__textarea:focus {
    outline: none;
  }
</style> 