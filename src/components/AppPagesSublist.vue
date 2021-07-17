<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="pages"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
        <tr @click="editItem(item)">
        <td class="d-flex justify-center align-center px-0">
          <v-icon class="mr-3" @click.stop="editItem(item)">mdi-pencil</v-icon>
          <v-icon @click.stop="deleteItem(item)">mdi-trash-can</v-icon>
        </td>
        <td>{{ item.name }}</td>
        <td align="right">{{ item.content?item.content.length:0 }}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
        <v-btn color="primary" dark class="mb-3" @click.native="editItem()">New Page</v-btn>
      </template>
    </v-data-table>
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
    <v-dialog v-model="pageDialog" @keydown.esc.prevent="pageDialog = false" max-width="100%" scrollable overlay-opacity="0.2" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">{{application.name}} Page</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="pageForm" v-model="valid" lazy-validation>
            <v-row><v-col cols="3 justify-space-between">
              <v-text-field v-model="page.name" label="Name" required :rules="[rules.required]"></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-select v-model="template" label="Template" :items="['Default','CRUD Example', 'Send Task Message', 'Create Calendar Event', 'Queue Task to Group', 'Task Completer', 'Misc Examples']" @input="onTemplateChange"></v-select>
            </v-col>
            <v-col cols="6" class="justify-end align-end">
              <div style="text-align:right" class="mb-0 black--text">Type "<span style="background-color:yellow"><b>%%%</b></span>" in the page to select and insert a system function or variable.</div>
              <div style="text-align:right" class="mb-0 black--text">Type "<span style="background-color:yellow"><b>~~~</b></span>" in the page to build and insert a component.</div>
              <div style="text-align:right" class="mb-0 black--text"><b>Note:</b> the "Page Object" must be assigned to a variable named <span style="background-color:yellow"><b>uiConfig</b></span>.</div>
              </v-col>
            </v-row>
            <!--v-textarea rows="20" v-model="page.content" label="Contents" required></v-textarea-->
            <prism-editor class="my-editor" v-model="page.content" :highlight="highlighter" line-numbers :rules="[rules.required]" @input="onPageChange"></prism-editor>
          </v-form>
        </v-card-text>
        <BuildComponentDialog :show="buildComponentDialog" @onSelect="insertComponent" @cancel="buildComponentDialog=false"/>
        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native="pageDialog=false">Cancel</v-btn>
          <!--v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native.stop="openTreeEditor"><v-icon left dark>mdi-file-tree</v-icon>Tree Editor</v-btn-->
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native.stop="save($event)"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
        </v-card-actions>
        <v-textarea v-if="errors.length>0" wrap="off" light color="red--text text--darken-2" class="mx-5 mt-4" label="Errors" :value="errors.join('\n')">
        </v-textarea>
      </v-card>
    </v-dialog>
    <!--v-dialog v-model="treeEditorDlg" @keydown.esc.prevent="pageDialog = false" max-width="95%" scrollable overlay-opacity="0.2" persistent>
      <VCDNEditor :key="page.content" type="Application" :name="page.name" :source="page.content" @changed="onTreeEditorChange" @cancelTreeEditor="treeEditorDlg = false" @saveTreeEditor="onTreeEditorSave"/>
    </v-dialog-->
  </div>
</template>

<script>
  import _ from 'lodash';
  import Api from '@/services/Api'
  import { EventBus } from '../event-bus.js';
  import vcdnUtils from '../_helpers/vcdnutils.js'
  import sendTaskMsg from '../apptemplates/sendtaskmessage.js'
  import createCalendarEvent from '../apptemplates/createcalendarevent.js'
  import crudExample from '../apptemplates/crudexample.js'
  import miscExamples from '../apptemplates/miscexamples.js'
  import queueTaskToGroup from '../apptemplates/queuetasktogroup.js'
  import taskCompleter from '../apptemplates/taskcompleter.js'
  import { PrismEditor } from 'vue-prism-editor';
  import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-clike';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles
  import BuildComponentDialog from './BuildComponentDialog'
//  import VCDNEditor from './VCDNEditor.vue'
  export default {
    components: { PrismEditor, BuildComponentDialog /*, VCDNEditor*/ },
    props: {
      organizationId: String,
      application: Object
    },
    computed: {
      pages() {
        var pgs = [].concat(this.application.pages) || [];
        return pgs;
      }
    },
    watch: {
      pageDialog (val) {
        val || this.close()
      },

    },

    mounted () {
      this.clientFunctions = Object.keys(vcdnUtils.clientFunctionMap);
      this.valid = true;
      this.buildComponentDialog = false;
    },

    methods: {
/*      openTreeEditor() {
        this.treeEditorDlg=true;
      },
      onTreeEditorChange( json ) {
      },
      onTreeEditorSave( json ) {
        var tmp = json+'';
        this.treeEditorDlg = false;
        setTimeout(()=>{
          this.page.content = tmp;
        }, 2000)
      },*/
      onTemplateChange() {
        if (this.template == 'Default') {
          this.page.content = vcdnUtils.getDefaultPage();
        } else if (this.template == 'CRUD Example') {
          this.page.content = crudExample;
        } else if (this.template == 'Misc Examples') {
          this.page.content = miscExamples;
        } else if (this.template == 'Send Task Message') {
          this.page.content = sendTaskMsg;
        } else if (this.template == 'Create Calendar Event') {
          this.page.content = createCalendarEvent;
        } else if (this.template == 'Queue Task to Group') {
          this.page.content = queueTaskToGroup;
        } else if (this.template == 'Task Completer') {
          this.page.content = taskCompleter;
        }
      },
      onClientFunctionSelect( clientFunction ) {
        if (clientFunction) {
          var script = vcdnUtils.clientFunctionMap[clientFunction];
          if (script) {
            this.page.content = this.page.content.replace('%%%', script);
            this.clientFunction = '';
          }
        }
        this.clientFuncSelectDialog = false;
      },
      insertComponent( comp ) {
        this.page.content = this.page.content.replace('~~~', comp);
        this.buildComponentDialog = false;
      },
      onPageChange( value ) {
        var found = value.indexOf('%%%')>=0;
        if (found) {
          this.clientFuncSelectDialog = true;
        }
        var found = value.indexOf('~~~')>=0;
        if (found) {
          this.buildComponentDialog = true;
          setTimeout(()=>{
            this.buildComponentDialog = false;
            console.log('buildComponentDialog set false');
          }, 2000)
        }
      },
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      editItem (item) {
        this.editedIndex = item?this.application.pages.findIndex((page) => {return page._id === item._id;}):-1;
        if (this.editedIndex<0 && !this.page.content) {
          this.page.content = this.defaultPage;
        }
        this.page = Object.assign({_id:'', name: '', content:''}, item);
        if (!item) {
          if (this.application.pages.length==0) {
            this.page.name = 'home';
          }
          this.page.content = this.defaultPage;
        }
        this.pageDialog = true;
        if (!item) {
          this.valid = true;
          if (this.$refs.pageForm) this.$refs.pageForm.resetValidation();
        }
      },

      deleteItem (item) {
        var vm = this;
        const index = this.application.pages.findIndex((page) => {return item._id?page._id === item._id:page.name === item.name;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var path = `/organizationapplication/page/${this.organizationId}/${this.application._id}/${item._id}`;
              var response = await Api().delete(path);
              if (response.data.success) {
                EventBus.$emit('global success alert', `${item.name} deleted.`);
                vm.$emit('pagesChanged', response.data.pages );
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg );
              }
            })();
          } else {
            this.application.pages.splice(index, 1);
          }
        }
      },

      close () {
        this.pageDialog = false;
        setTimeout(() => {
          this.page = {
            name: this.application.pages.length==0?'home':'',
            content: this.defaultPage
          };
          this.editedIndex = -1;
        }, 300)
      },

      save (e) {
        e.preventDefault();
        var vm = this;
        if (!this.$refs.pageForm.validate()) return;
        var operation = this.page._id ? 'update' : 'add';
        var errors = [];
        try {
          var uiConfig = vcdnUtils.sandboxedStringToJSON(this.page.content);
          errors = vcdnUtils.checkStructure(uiConfig, 'page') || [];
        } catch (e) {
          errors.push(e+'');
        }
        this.errors = errors;
        if (operation == 'update' || this.application._id) {
          (async () => {
            var postObj = {organizationId: this.organizationId, applicationId:this.application._id, pageId: this.page._id, name:this.page.name, content: this.page.content};
            var response = await Api().post('/organizationapplication/writepage', postObj );
            if (response.data.success) {
              EventBus.$emit('global success alert',  `${this.page.name} ${operation=='update'?'updated':'added'}.`);
              if (errors.length==0) {
                this.pageDialog = false;
                var newPage = response.data.pages.find(p=>(p.name==this.page.name));
                this.page._id = newPage._id;
                vm.$emit('pagesChanged', response.data.pages );
              }
              EventBus.$emit('global success alert', `${this.page.name} ${this.editedIndex > -1?'updated':'added'}${errors.length>0?' with errors':''}.`);
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert',  response.data.errMsg );
            }
          })();
        } else {
          var pages = [].concat(this.application.pages);
          pages = pages.filter(p=>(p._id || p.name!=this.page.name));
          pages.push({name:this.page.name, content: this.page.content});
          vm.$emit('pagesChanged', pages );
          if (errors.length==0) {
            this.pageDialog = false;
          }
        }
      }
    },
    data: () => ({
      template: 'Default',
      timeoutId: null,
      pageDialog: false,
      clientFuncSelectDialog: false,
      buildComponentDialog: false,
      treeEditorDlg: false,
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Length', align: 'right', sortable: true, value: 'content.length' }
      ],
      rules: {
          required: value => !!value || 'Required.'
      },
      editedIndex: -1,
      page: {
        _id: '',
        name: '',
        content: ''
      },
      errors: [],
      defaultPage: vcdnUtils.getDefaultPage(),
      clientFunctions: [],
      clientFunction:''
    })
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