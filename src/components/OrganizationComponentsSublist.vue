<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="organization.components"
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
        <td>{{ item.componentId }}</td>
        <td>{{ item.source}}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="100%" scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Component</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Component</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="appForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required :rules="[rules.required]"></v-text-field>
              <v-text-field v-model="editedItem.componentId" label="Id" required :rules="[rules.required]"></v-text-field>
              <v-radio-group v-model="editedItem.source" row label="Source">
                <v-radio label='App Server' value='App Server'></v-radio>
                <v-radio label='CloudHaven' value='CloudHaven'></v-radio>
              </v-radio-group>
              <prism-editor class="my-editor" v-model="editedItem.content" :highlight="highlighter" line-numbers :rules="[rules.required]"></prism-editor>
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
  import Api from '@/services/Api'
  import { PrismEditor } from 'vue-prism-editor';
  import { EventBus } from '../event-bus.js';
  import vcdnUtils from '../_helpers/vcdnutils.js'
  import 'vue-prism-editor/dist/prismeditor.min.css'; // import the styles somewhere
 
  // import highlighting library (you can use any library you want just return html string)
  import { highlight, languages } from 'prismjs/components/prism-core';
  import 'prismjs/components/prism-clike';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/themes/prism-funky.css'; // import syntax highlighting styles
  export default {
    components: { PrismEditor },
    props: ['organization'],
    data: () => ({
      dialog: false,
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Id', align: 'left', sortable: true, value: 'componentId' },
        { text: 'Source', align: 'left', sortable: true, value: 'source' }
      ],
      rules: {
          required: value => !!value || 'Required.'
      },
      editedIndex: -1,
      editedItem: {
        name: '',
        componentId: '',
        source: 'App Server',
        content: vcdnUtils.getDefaultComponent()
      },
      errors: []

    }),
    computed: {
    },
    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
      this.content = vcdnUtils.getDefaultComponent();
    },

    methods: {
      highlighter( code ) {
        return highlight(code, languages.js);
      },
      createFormData(operation) {
        return {
          operation: operation,
          organization_Id:this.organization._id,
          component_Id: this.editedItem._id,
          componentId: this.editedItem.componentId,
          name: this.editedItem.name,
          source: this.editedItem.source,
          content: this.editedItem.content
        };
      },
      editItem (item) {
        debugger;
        if (!this.organization.components) this.organization.components = [];
        this.editedIndex = this.organization.components.findIndex((component) => {return component.name === item.name;});
        if (!this.content) {
          this.content = vcdnUtils.getDefaultComponent();
        }
        this.editedItem = Object.assign({
          name: '',
          componentId:'',
          source: 'App Server'
        }, item);
        this.dialog = true;
      },

      deleteItem (item) {
        var vm = this;
        const index = this.organization.components.findIndex((component) => {return component.name === item.name && component.contactType == item.contactType;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationcomponent/'+this.organization._id+'/'+item._id);
              debugger;
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
                vm.$emit('orgCompsChanged', response.data.components);
                this.organization.components.splice(index, 1);
                this.$store.dispatch('loadRecords', 'organizations');
              } else if (response.data.errMsg) {
                this.appErrMsg = response.data.errMsg;
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
          this.editedItem = {
            name: '',
            componentId: '',
            source: 'App Server'
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        var vm = this;
        if (!this.$refs.appForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        if (operation == 'update' || this.organization._id) {
          (async () => {
            var response = await Api().post('/organizationcomponent', this.createFormData(operation));
            if (response.data.success) {
              EventBus.$emit('global success alert', `${this.editedItem.name} ${operation=='update'?'updated':'added'}.`);
              vm.$emit('orgCompsChanged', response.data.components);
              this.dialog = false;
            } else if (response.data.errMsg) {
              EventBus.$emit('global success alert', response.data.errMsg );
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