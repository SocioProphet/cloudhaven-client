<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="vendor.components"
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
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="500px" scrollable>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Component</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Component</span>
          </v-card-title>
          <v-card-text>
          <v-alert
            :value="appErrMsg?true:false"
            dismissible
            type="error"
          >
            {{appErrMsg}}
          </v-alert>
            <v-form ref="appForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required></v-text-field>
              <v-text-field v-model="editedItem.componentId" label="Id" required></v-text-field>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="dialog=false">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      </template>
    </v-data-table>
  </div>
</template>

<script>
  import Api from '@/services/Api'
  export default {
    props: ['vendor'],
    data: () => ({
      dialog: false,
      appErrMsg:'',
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Id', align: 'left', sortable: true, value: 'componentId' }
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        componentId: ''
      }
    }),
    computed: {
    },
    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
    },

    methods: {
      createFormData(operation) {
        return {
          operation: operation,
          vendor_Id:this.vendor._id,
          component_Id: this.editedItem._id,
          componentId: this.editedItem.componentId,
          name: this.editedItem.name
        };
      },
      editItem (item) {
        if (!this.vendor.components) this.vendor.components = [];
        this.editedIndex = this.vendor.components.findIndex((component) => {return component.name === item.name;});
        this.editedItem = Object.assign({
          name: '',
          componentId:''
        }, item);
        this.dialog = true;
        this.appErrMsg = '';
        setTimeout(()=>{
          this.prepDragNDrop();
          }, 500);
      },

      deleteItem (item) {
        const index = this.vendor.components.findIndex((component) => {return component.name === item.name && component.contactType == item.contactType;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/vendorcomponent/'+this.vendor._id+'/'+item._id);
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
                this.vendor.components.splice(index, 1);
                this.$store.dispatch('loadRecords', 'vendors');
                this.appErrMsg = '';
              } else if (response.data.errMsg) {
                this.appErrMsg = response.data.errMsg;
              }
            })();
          } else {
            this.vendor.components.splice(index, 1);
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.appErrMsg = '';
          this.editedItem = {
            name: '',
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.appForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        if (operation == 'update' || this.vendor._id) {
          (async () => {
            var response = await Api().post('/vendorcomponent', this.createFormData(operation));
            if (response.data.success) {
              this.$store.commit('SET_SUCCESS', `${this.editedItem.name} ${operation=='update'?'updated':'added'}.`);
              this.vendor.components = response.data.components;
              this.dialog = false;
              this.$store.dispatch('loadRecords', 'vendors')
              this.appErrMsg = '';
            } else if (response.data.errMsg) {
              this.appErrMsg = response.data.errMsg;
            }
          })();
        } else {
          this.vendor.components.push(this.editedItem)
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