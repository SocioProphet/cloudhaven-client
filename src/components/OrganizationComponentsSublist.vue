<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="components"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
        <tr @click="editItem(item)">
        <td class="d-flex justify-center align-center px-0">
          <v-icon
            class="mr-3"
            @click.stop="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
        </td>
        <td v-if="isAdmin">{{item.organizationId}}</td>
        <td>{{ item.componentId }}</td>
        <td>{{ item.source}}</td>
        <td>{{ item.status}}</td>
        <td v-if="isAdmin">{{item.isApproved?'APPROVED':''}}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="100%" persistent scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Component</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Component</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="appForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.componentId" label="Name" required :rules="[rules.required, rules.elementName]"></v-text-field>
              <v-radio-group v-model="editedItem.source" row label="Source">
                <v-radio label='App Server' value='App Server'></v-radio>
                <v-radio label='CloudHaven' value='CloudHaven'></v-radio>
              </v-radio-group>
              <v-radio-group v-model="editedItem.status" row label="Status">
                <v-radio label='Draft' value='Draft'></v-radio>
                <v-radio label='Published' value='Published'></v-radio>
              </v-radio-group>
              <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" >
              <v-tab>Source</v-tab>
              <v-tab>Documentation</v-tab>
              <v-tab-item>
                <prism-editor class="my-editor" v-model="editedItem.content" :highlight="highlighter" line-numbers :rules="[rules.required]"></prism-editor>
              </v-tab-item>
              <v-tab-item>
                <v-row class="mt-1 mb-2">
                  <v-col cols="2" class="d-flex align-start">
                    <v-text-field label="Enter a keyword" v-model="keyword" @keydown.enter="addKeyword"
                      persistent-hint hint="type keyword and press enter"></v-text-field>
                  </v-col>
                  <v-col class="d-flex justify-left">
                      <v-chip outlined class="ma-1" v-for="(kw, index) in editedItem.keywords" :key="index" close @click:close="removeKeyword(index)">{{ kw }}</v-chip>
                  </v-col>
                </v-row>
              <tiptap-vuetify v-model="editedItem.documentation" :extensions="extensions" />
              </v-tab-item>
            </v-tabs>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="dialog=false">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
          <v-textarea v-if="errors.length>0" wrap="off" light color="red--text text--darken-2" class="mx-5 mt-4" label="Errors" :value="errors.join('\n')">
          </v-textarea>
        </v-card>
      </v-dialog>
      </template>
    </v-data-table>
  </div>
</template>

<script>
  import Api from '@/services/Api';
  import { mapState } from 'vuex'
  import _ from 'lodash';
  import { PrismEditor } from 'vue-prism-editor';
  import { EventBus } from '../event-bus.js';
  import vcdnUtils from '../_helpers/vcdnutils.js'
  import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
 
  // import highlighting library (you can use any library you want just return html string)
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-clike';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles

  import { TiptapVuetify, Heading, Bold, Italic, Strike, Underline, Code, Paragraph, BulletList, OrderedList, ListItem, Link, Blockquote, HardBreak, HorizontalRule, History } from 'tiptap-vuetify';

  const defaultDocumentation = "<h2>Description</h2><p>Add a description of this component here...</p><h2>Properties (props)</h2><ul><li><p>prop1 (String)<br>prop1 is for ...</p></li><li><p>prop2 (Object)<br>prop2 is for ...</p></li></ul><h2>Events</h2><ul><li><p>input<br>parameter: the parameter for this event contains...<br>input event occurs when... </p></li><li><p>event2<br>parameter: the parameter for this event contains...<br>event2 occurs when... <br></p></li></ul>";

  export default {
    components: { PrismEditor, TiptapVuetify },
    props: ['organization'],
    data: () => ({
      dialog: false,
      valid: true,
      rawHeaders: [
        { text: 'Actions', value: 'name', sortable: false, align:'center', width:"80px" },
        { text: 'Name (Id)', align: 'left', sortable: true, value: 'componentId' },
        { text: 'Source', align: 'left', sortable: true, value: 'source' },
        { text: 'Status', align: 'left', sortable:true, name: 'status'}
      ],
      rules: {
          required: value => !!value || 'Required.',
          elementName: value => {
            /*!!value ||*/ return /[a-z][a-z0-9\-._]*-[a-z0-9\-._]*$/.test(value) || 'Must start with a-z and must contain a dash (like "x1-a2").';
          }
      },
      editedIndex: -1,
      keyword: '',
      defaultPage: {
        _id: '',
        componentId: '',
        source: 'App Server',
        status: 'Draft',
        keywords: [],
        documentation: defaultDocumentation,
        content: vcdnUtils.getDefaultComponent()
      },
      editedItem: {keywords:[], content: vcdnUtils.getDefaultComponent()},
      errors: [],
      extensions: [
        History,
        Blockquote,
        Link,
        Underline,
        Strike,
        Italic,
        ListItem,
        BulletList,
        OrderedList,
        [Heading, {
          options: {
            levels: [1, 2, 3]
          }
        }],
        Bold,
        Code,
        HorizontalRule,
        Paragraph,
        HardBreak
      ]

    }),
    computed: {
      headers() {
        if (this.isAdmin) {
          var hdrs = [].concat(this.rawHeaders);
          hdrs.splice(1,0, { text: 'Organization Id', align: 'left', sortable: true, value: 'organizationId' });
          hdrs.push({ text: 'Approved', align:'left', sortable:true, value: 'isApproved'});
          return hdrs;
        } else {
          return this.rawHeaders;
        }
      },
      components() {
        if (this.isAdmin) {
          var comps = this.organizations.reduce((ar,org)=>{
            org.components.forEach(c=>{
              var comp = Object.assign({organizationId:org.organizationId}, c);
              ar.push(comp);
            })
            return ar;
          },[]);
          comps = comps.sort((a,b)=>{
            var aKey = a.organizationName+'-'+a.componentId;
            var bKey = b.organizationName+'-'+b.componentId;
            return aKey<bKey?-1:(aKey>bKey?1:0);
          });
          return comps;
        } else {
          return this.organization.components;
        }
      },
      isAdmin() {
        return this.user.rolesMap['SYSADMIN'];
      },
      ...mapState(['organizations','user'])
    },
    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      this.content = vcdnUtils.getDefaultComponent();
      if (this.isAdmin) {
        this.$store.commit('SET_CRUDAPISERVCE', 'organizations');
        this.loadOrganizations();
      }
    },

    methods: {
      loadOrganizations() {
        this.$store.dispatch('loadRecords', 'organizations');
      },
      addKeyword() {
        this.editedItem.keywords.push(this.keyword);
        this.keyword = '';
      },
      removeKeyword( index ) {
        this.editedItem.keywords.splice(index, 1);
      },
      resetPage() {
        this.editedItem = Object.assign({}, _.clone(this.defaultPage));
      },
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      createFormData(operation) {
        return {
          operation: operation,
          organization_Id:this.organization._id,
          component_Id: this.editedItem._id,
          componentId: this.editedItem.componentId,
          source: this.editedItem.source,
          status: this.editedItem.status,
          keywords: this.editedItem.keywords,
          documentation: this.editedItem.documentation,
          content: this.editedItem.content
        };
      },
      editItem (item) {
        if (!this.organization.components) this.organization.components = [];
        this.editedIndex = this.organization.components.findIndex((component) => {return component._id === item._id;});
        if (!this.editedItem.content) {
          this.editedItem.content = vcdnUtils.getDefaultComponent();
        }
        if (!Array.isArray(item.keywords)) item.keywords = [];
        this.editedItem = Object.assign({
          _id: '',
          componentId:'',
          source: 'App Server',
          status: 'Draft',
          keywords: [],
          documentation: '',
          content: ''
        }, item);
        if (!this.editedItem.documentation) {
          this.editedItem.documentation = defaultDocumentation;
        }

        this.dialog = true;
      },

      deleteItem (item) {
        var vm = this;
        const index = this.organization.components.findIndex((component) => {return component._id === item._id;})
        if (confirm('Are you sure you want to delete '+item.componentId+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationcomponent/'+this.organization._id+'/'+item._id);
              if (response.data.success) {
                EventBus.$emit('global success alert', `${item.componentId} deleted.`);
                vm.$emit('orgCompsChanged', response.data.components);
                this.organization.components.splice(index, 1);
                this.$store.dispatch('loadRecords', 'organizations');
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg );
              }
            })();
          } else {
            this.organization.components.splice(index, 1);
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.resetPage();
          this.editedIndex = -1
        }, 300)
      },

      save () {
        var vm = this;
        if (!this.$refs.appForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        var errors = [];
        try {
          var uiConfig = eval(this.editedItem.content);
          errors = vcdnUtils.checkSyntax(uiConfig, true) || [];
        } catch (e) {
          errors.push(e+'');
        }
        this.errors = errors;
        if (operation == 'update' || this.organization._id) {
          (async () => {
            var response = await Api().post('/organizationcomponent', this.createFormData(operation));
            if (response.data.success) {
              EventBus.$emit('global success alert', `${this.editedItem.componentId} ${operation=='update'?'updated':'added'}.`);
              if (this.errors.length==0) {
                vm.$emit('orgCompsChanged', response.data.components);
                this.dialog = false;
              }
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            }
          })();
        } else {
          this.organization.components.push(this.editedItem)
          this.dialog = false;
        }
      }
    }
  }
</script>

<style>
.dragTargetDiv {
   display: block;
    height: 100%;
    width: 100%;
    background: #ccc;
    margin: auto;
    margin-top: 10px;
    text-align: center;
    line-height: 200px;
    border-radius: 4px;
    font-size:18px;
}
</style>