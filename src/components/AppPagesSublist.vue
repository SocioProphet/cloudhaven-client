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
          <v-icon
            small
            class="mr-3"
            @click.stop="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            small
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
        </td>
        <td>{{ item.name }}</td>
        <td align="right">{{ item.content?item.content.length:0 }}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="pageDialog" @keydown.esc.prevent="pageDialog = false" max-width="100%" scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Page</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Page</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="pageForm" v-model="valid" lazy-validation>
              <v-row><v-col cols="3">
              <v-text-field v-model="page.name" label="Name" required :rules="[rules.required]"></v-text-field>
              </v-col>
              <v-col cols="9" class="d-flex justify-right align-end">
              <v-spacer></v-spacer>
                <v-flex>
                <div style="display:inline-block" class="mb-0 black--text">Type "<b>%%%</b>" in the page to select client function to insert.</div>
                <div style="display:inline-block" class="mb-0 black--text">Type "<b>~~~</b>" in the page to select a component to insert.</div>
                </v-flex>
                </v-col>
              </v-row>
              <!--v-textarea rows="20" v-model="page.content" label="Contents" required></v-textarea-->
              <prism-editor class="my-editor" v-model="page.content" :highlight="highlighter" line-numbers :rules="[rules.required]" @input="onPageChange"></prism-editor>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="pageDialog=false">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native.stop="save($event)"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
          <v-textarea v-if="errors.length>0" wrap="off" light color="red--text text--darken-2" class="mx-5 mt-4" label="Errors" :value="errors.join('\n')">
          </v-textarea>
        </v-card>
      </v-dialog>
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
    <v-dialog v-model="componentSelectDialog" @keydown.esc.prevent="componentSelectDialog = false" max-width="800px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>Insert a Component</v-card-title>
        <v-card-text>
          <v-form ref="componentSearchForm">
            <v-text-field class="mb-3" v-model="componentSearchNameFilter" label="Name Filter" persistent-hint hint="Search for components with this phrase in the name."></v-text-field>
            <v-combobox v-model="componentSearchKeywords" :items="allComponentKeywords" label="Search by keyword" multiple chips ></v-combobox>
            <v-data-table :items="components" :headers="componentHeaders" class="mt-2 elevation-1">
              <template v-slot:item="{ item }">
                <tr @click="insertComponent(item)">
                  <td><v-btn @click.stop="insertComponent(item)">Insert</v-btn></td>
                  <td>{{ item.componentName }}</td>
                  <td>{{ item.organizationName }}</td>
                  <td><v-btn @click.stop="showDocumentation(item)">Show</v-btn></td>
                </tr>
              </template>
            </v-data-table>
          </v-form>
        </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="componentSelectDialog=false">Cancel/Close</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="fetchComponents">Search</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="documentationDialog" @keydown.esc.prevent="componentSelectDialog = false" max-width="900px" scrollable overlay-opacity="0.2">
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
  import _ from 'lodash';
  import { EventBus } from '../event-bus.js';
  import Api from '@/services/Api'
  import { PrismEditor } from 'vue-prism-editor';
  import vcdnUtils from '../_helpers/vcdnutils.js'
  import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
 
  // import highlighting library (you can use any library you want just return html string)
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-clike';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles
  export default {
    components: { PrismEditor },
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
      this.page.content = this.defaultPage;
      this.page.name = this.application.pages.length==0?'home':'';
      this.clientFunctions = Object.keys(vcdnUtils.clientFunctionMap);
      this.clientFunctions.unshift('[component]');
      this.componentSearchNameFilter = '';
      this.allComponentKeywords = [];
      this.componentSearchKeywords = [],
      this.components = [];
      this.valid = true;
    },

    methods: {
      fetchComponents() {
        (async () => {
          var response = await Api().post('/organizationcomponent/searchcomponents',
            {keywordsFilter: this.keywords, nameFilter: this.componentSearchNameFilter});
          if (response.data.success) {
            this.components = response.data.components;
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg );
          }
        })();

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
      insertComponent( item ) {
        this.page.content = this.page.content.replace('~~~', `{component: 'dynamicComponent', organizationId:'${item.organizationId}', componentId: '${item.componentId}'}`);
        this.componentSelectDialog = false;
      },
      showDocumentation(item) {
        this.documentationItem = item;
        this.documentationDialog = true;
      },
      onPageChange( value ) {
        var found = value.indexOf('%%%')>=0;
        if (found) {
          this.clientFuncSelectDialog = true;
        }
        var found = value.indexOf('~~~')>=0;
        if (found) {
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
          this.fetchComponents();
          this.componentSelectDialog = true;
        }
      },
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      editItem (item) {
        this.editedIndex = this.application.pages.findIndex((page) => {return page.name === item.name;});
        if (this.editedIndex<0 && !this.page.content) {
          this.page.content = this.defaultPage;
        }
        this.page = Object.assign({name: '', content:''}, item);
        this.pageDialog = true;
      },

      deleteItem (item) {
        var vm = this;
        const index = this.application.pages.findIndex((page) => {return page.name === item.name;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var path = `/organizationapplication/page/${this.organizationId}/${this.application._id}/${encodeURIComponent(item.name)}`;
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
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        var errors = [];
        try {
          var uiConfig = eval(this.page.content);
          errors = vcdnUtils.checkSyntax(uiConfig) || [];
        } catch (e) {
          errors.push(e+'');
        }
        this.errors = errors;
        if (operation == 'update' || this.application._id) {
          (async () => {
            var response = await Api().post('/organizationapplication/writepage', 
              {organizationId: this.organizationId, applicationId:this.application._id, pageName:this.page.name, content: this.page.content});
            if (response.data.success) {
              EventBus.$emit('global success alert',  `${this.page.name} ${operation=='update'?'updated':'added'}.`);
              vm.$emit('pagesChanged', response.data.pages );
              if (errors.length==0) {
                this.pageDialog = false;
              }
              EventBus.$emit('global success alert', `${this.page.name} ${this.editedIndex > -1?'updated':'added'}${errors.length>0?' with errors':''}.`);
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert',  response.data.errMsg );
            }
          })();
        } else {
          var pages = [].concat(this.application.pages);
          pages.push(this.page);
          vm.$emit('pagesChanged', pages );
          this.pageDialog = false;
        }
      }
    },
    data: () => ({
      pageDialog: false,
      clientFuncSelectDialog: false,
      componentSelectDialog: false,
      componentSearchNameFilter: '',
      allComponentKeywords: [],
      componentSearchKeywords: [],
      components: [],
      documentationDialog: false,
      documentationItem: {},
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Length', align: 'right', sortable: true, value: 'content.length' }
      ],
      componentHeaders: [
        { text: "Insert", align:'left', sortable:false},
        { text: 'Organization', align: 'left', sortable: true, value: 'organizationName' },
        { text: 'Component', align: 'left', sortable: true, value: 'componentName' },
        { text: "Documentation", align:'left', sortable:false}
      ],
      rules: {
          required: value => !!value || 'Required.'
      },
      editedIndex: -1,
      page: {
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