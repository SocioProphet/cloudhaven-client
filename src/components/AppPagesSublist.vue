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
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="100%" scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Page</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Page</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="pageForm" v-model="valid" lazy-validation>
              <v-text-field v-model="page.name" label="Name" required></v-text-field>
              <!--v-textarea rows="20" v-model="page.content" label="Contents" required></v-textarea-->
              <prism-editor class="my-editor" v-model="page.content" :highlight="highlighter" line-numbers></prism-editor>
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
  import { EventBus } from '../event-bus.js';
  import Api from '@/services/Api'
  import { PrismEditor } from 'vue-prism-editor';
  import JSON5 from 'json5'
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
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      this.page.content = this.defaultPage;
    },

    methods: {
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      editItem (item) {
        this.editedIndex = this.application.pages.findIndex((page) => {return page.name === item.name;});
        if (this.editedIndex<0 && !this.page.content) {
          this.page.content = this.defaultPage;
        }
        this.page = Object.assign({name: '', content:''}, item);
        this.dialog = true;
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
                vm.$emit('appPagesChanged', response.data.pages );
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
        this.dialog = false;
        setTimeout(() => {
          this.appErrMsg = '';
          this.page = {
            name: '',
            content: this.defaultPage
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        var vm = this;
        if (!this.$refs.pageForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        var errors = [];
        try {
          var uiConfig = JSON5.parse(this.page.content);
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
              this.$store.commit('SET_SUCCESS', `${this.page.name} ${operation=='update'?'updated':'added'}.`);
              vm.$emit('appPagesChanged', response.data.pages );
              if (errors.length==0) {
                this.dialog = false;
              }
              EventBus.$emit('global success alert', `${this.page.name} passed syntax cgecj${this.editedIndex > -1?'updated':'added'}${errors.length>0?' with errors':''}.`);
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert',  response.data.errMsg );
            }
          })();
        } else {
          var pages = [].concat(this.application.pages);
          pages.push(this.page);
          vm.$emit('appPagesChanged', pages );
          this.dialog = false;
        }
      }
    },
    data: () => ({
      dialog: false,
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Length', align: 'right', sortable: true, value: 'content.length' }
      ],
      editedIndex: -1,
      page: {
        name: '',
        content: ''
      },
      errors: [],
      defaultPage: `{
  requiredUserData: ['firstName', 'lastName'],
  dataModel:{
    displayString:''
  },
  methods: {
    mounted: {
      args:[],
      body: 'this.displayString = "CloudHaven skeleton application";'
    }
  },
  computed: {
    decoratedDisplayString: {
      args:[],
      body: "return '** '+this.displayString+' **';"
    }
  },
  externalComponents: [{organizationId:'some-org', componentId:'some-component-id'}],
  appFrame: {
    name: 'Skeleton App',
    appBarStyle: {background: 'linear-gradient(rgb(40, 54, 102) 0%, rgb(37, 114, 210) 100%)'},
    appBarTextClass: 'yellow--text text--accent-2',
    nameTextClass: 'white--text',
    menuItems: [ //These are just examples and need to be replaced by real pages
      { page: 'home', title: 'Dashboard'},
      { page: 'widgets', title: 'Widgets'}, 
    ]
  },
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: 'This is the title' },
        {component: 'cardText', contents: [
            {component: 'sheet', props:{'min-width':'200px', 'min-height':'200px'}, class: 'mt-auto mb-auto ml-auto mr-auto',
              template: '<span>{{decoratedDisplayString}}</span>'}]}
        ]}
    ]
  }
}
      `
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