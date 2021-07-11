<template>
  <div class="mt-3">
      <v-toolbar dense elevation="5">
      <v-toolbar-title class="mr-3">VCDN Editor</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>
    <v-treeview :items="rootNodes" elevation="2" dense class="mt-3" activatable :open="open" :active="active" hoverable @update:active="onActivated">
      <template v-slot:label="{ item, active }">
        <div v-if="item.root=='dataModel'">
          <span >{{item.name}}{{item.value?(' : '+item.value):''}}
            <v-icon v-if="canHaveChild(item)" @click.stop="addPropertyDlg(item)">mdi-plus-thick</v-icon>
            <v-icon v-if="item.level>0 && item.name" @click.stop="editPropertyDlg(item)">mdi-pencil</v-icon>
            <v-icon @click.stop="deleteItem(item)" class="ml-2">mdi-trash-can</v-icon>
          </span>
          <v-sheet v-if="propDialog && (propObj.editMode=='add' || editId==item.id)" elevation="1" width="300px" max-width="300px">
            <v-form ref="propForm" v-model="propFormValid">
            <div class="d-flex justify-left mb-2">
              <v-text-field :id="propObj.id" label="Property" single-line dense v-model="propObj.name" :rules="[rules.required, rules.validPropName]"></v-text-field><span class="mx-2 pb-0 pt-1"> <b>:</b> </span>
              <v-text-field label="Value" persistent-hint hint="(optional)" single-line dense v-model="propObj.value" :rules="[rules.required, rules.validPropValue]"></v-text-field>
                <v-btn icon @click.native.stop="saveProperty()"><v-icon>mdi-content-save</v-icon></v-btn>
                <v-btn icon @click.native="propDialog=false"><v-icon>mdi-close-thick</v-icon></v-btn>{{propObj.name?'':setFocus(propObj.id)}}
            </div>
            </v-form>
          </v-sheet>
        </div>
        <div v-else-if="isFunctionType(item)">
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
          <span >{{item.name}}
            <v-icon v-if="canHaveChild(item)" @click.stop="addComponentDlg(item)">mdi-plus-thick</v-icon>
            <v-icon v-if="item.level>0 && item.name" class="ml-2" @click.stop="editComponentDlg(item)">mdi-pencil</v-icon>
            <v-btn v-if="item.level>0" x-small class="ml-2" elevation="1" @click.stop="addSlotDlg(item)"><v-icon small>mdi-plus</v-icon>slot</v-btn>
            <v-icon @click.stop="deleteItem(item)" class="ml-2">mdi-trash-can</v-icon>
          </span>
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
    <v-dialog v-model="funcDialog" @keydown.esc.prevent="funcDialog = false" overlay-opacity="0.2" elevation="3">
      <v-card>
        <v-card-title>{{funcObj.title}}</v-card-title>
        <v-card-text>
          <v-form ref="funcForm" @click.stop=""  v-model="valid" lazy-validation >
            <v-text-field style="width:300px" dense v-model="funcObj.name" label="Name" :rules="[rules.required, rules.validFuncName]" @click.stop="" ></v-text-field>
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
    <v-dialog v-model="compDialog" width="600px" @keydown.esc.prevent="compDialog = false" overlay-opacity="0.2" elevation="3">
      <v-card>
        <v-card-title>{{compObj.title}}</v-card-title>
        <v-card-text>
          <v-form ref="compForm" @click.stop=""  v-model="valid" lazy-validation >
            <v-select v-model="compObj.name" label="Component " :items="componentList" :rules="[rules.required]"></v-select>
            <v-textarea class="mt-2" rows="4" auto-grow v-model="compObj.properties" label="Properties" :rules="[rules.required, rules.validCompProps]"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native="saveComponent()"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// js valid property regex ^[a-zA-Z$_][a-zA-Z0-9$_]*$

import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import vcdnUtils from '../_helpers/vcdnutils.js'
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles

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
    components: { PrismEditor },
    props: {
      type: String
    },
    data: () => ({
      propertyDlg: false,
      propObj:{editMode:'add', title:'', name:'', value:''},
      funcObj:{editMode:'add', title:'', parent:{}, newArg:'', name:'', arguments:[], body:''},
      funcDialog: false,
      propDialog: false,
      editId:'',
      valid: true,
      propFormValid: true,
      clientFuncSelectDialog: false,
      clientFunctions: [],
      clientFunction:'',
      bodyErrMsg:'',
      compDialog:false,
      compFormValid:true,
      compObj:{name:'', properties:''},
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
      componentList: []
    }),
    computed: {
      ...mapState(['user'])
    },

    watch: {
    },

    mounted () {
      this.clientFunctions = Object.keys(vcdnUtils.clientFunctionMap);
      var items = [
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
      }
      this.rootNodes = items;
      this.componentList = Object.keys(vcdnUtils.uiElementToVueCompMap).sort((a,b)=>(a<b?-1:(a>b?1:0)));
    },
    methods: {
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
          el.focus();
        })
        return '';
      },
      canHaveChild( item ) {
        return (
          (item.root == 'dataModel' && !item.value) ||
          (this.isFunctionType(item) && item.level==0) ||
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
      isFunctionType( item ) {
        return ['methods', 'computed', 'watch', 'filters'].indexOf(item.root)>=0;
      },
      addPropertyDlg(parent) {
        this.propObj.editMode = 'add';
        this.editId = '';
        this.propObj.id = 'prop_'+this.initId();
        this.propObj.title  = `New ${(parent.name.charAt(parent.name.length-1)=='s')?parent.name.substring(0, parent.name.length-1):parent.name} property`;
        this.propObj.parent = parent;
        this.propObj.name = '';
        this.propObj.value = '';
        this.propDialog = true;
      },
      editPropertyDlg(item) {
        this.editId = item.id;
        this.propObj.editMode = 'edit';
        this.propObj.title  = `Edit property ${item.name}`;
        this.propObj.name = item.name;
        this.propObj.value = item.value;
        this.propDialog = true;
      },
      saveProperty( item ) {
        if (!this.$refs.propForm.validate()) return;
        if (this.propObj.editMode == 'add') {
          this.open.push(this.propObj.parent.id);
          var id = this.initId();
          this.propObj.parent.children.push({id:id, value:this.propObj.value, name:this.propObj.name, root:this.propObj.parent.root, level:this.propObj.parent.level+1});
          this.active = [id+''];
        } else {
          item.name = this.propObj.name;
          item.value = this.propObj.value;
        }
        this.propDialog = false;
      },
      addFunctionDlg(parent) {
        this.editedItem = parent;
        this.bodyErrMsg = '';
        this.funcObj.editMode = 'add';
        this.funcObj.title  = `New ${(parent.name.charAt(parent.name.length-1)=='s')?parent.name.substring(0, parent.name.length-1):parent.name}`;
        this.funcObj.parent = parent;
        this.funcObj.name = '';
        this.funcObj.arguments = parent.root=='watch'?["newVal", "oldVal"]:(parent.root=='filters'?["value"]:[]);
        this.funcObj.body = '';
        this.funcDialog = true;
      },
      editFunctionDlg(item) {
        this.editedItem = item;
        this.bodyErrMsg = '';
        var type = (item.name.charAt(item.name.length-1)=='s')?item.name.substring(0, item.name.length-1):item.name;
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
          this.funcObj.parent.children.push({id:id, arguments:this.funcObj.arguments, body:this.funcObj.body, name:this.funcObj.name, root:this.funcObj.parent.root, level:this.funcObj.parent.level+1});
          this.active = [id+''];
        } else {
          this.editedItem.title = this.funcObj.title;
          this.editedItem.arguments = this.funcObj.arguments;
          this.editedItem.body = this.funcObj.body;
        }
        this.funcDialog = false;
      },
      addComponentDlg(parent) {
        this.editedItem = parent;
        this.compObj = {name:'', properties:
`{
  props:{},
  vmodel:'',
  class:'',
  on:{}
}`};
        this.compObj.editMode = 'add';
        this.compObj.parent = parent;
        this.compDialog = true;
      },
      editComponentDlg(item) {
        this.editedItem = item;
        this.compObj.editMode = 'edit';
        this.compObj.title  = `Edit ${item.name}`;
        this.compDialog = true;
      },
      saveComponent() {
        if (!this.$refs.compForm.validate()) return;
        if (this.compObj.editMode == 'add') {
          this.open.push(this.compObj.parent.id);
          var id = this.initId();
          this.compObj.parent.children.push({id:id, name:this.compObj.name, properties:this.compObj.properties, root:this.compObj.parent.root, level:this.compObj.parent.level+1});
          this.active = [id+''];
        } else {
          this.editedItem.title = this.compObj.title;
          this.editedItem.properties = this.compObj.properties;
        }
        this.compDialog = false;
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