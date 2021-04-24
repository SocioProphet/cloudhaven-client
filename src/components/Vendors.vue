<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>Vendors</v-toolbar-title>
      <v-divider
        class="mx-3"
        inset
        vertical
      ></v-divider>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" max-width="900px">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Vendor</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>

          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required :rules="[rules.required]"></v-text-field>
              <v-text-field v-model="editedItem.vendorId" label="Id" required :rules="[rules.required]"></v-text-field>
              <v-text-field v-model="editedItem.componentsUrl" label="Components URL" :rules="[rules.url]"></v-text-field>
            </v-form>
          </v-card-text>
              <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" >
              <v-tab>Applications</v-tab>
              <v-tab>Components</v-tab>
              <v-tab>Contacts</v-tab>
              <v-tab-item>
                <VendorAppsSublist :vendor="editedItem"/>
              </v-tab-item>
              <v-tab-item>
                <VendorComponentsSublist :vendor="editedItem"/>
              </v-tab-item>
              <v-tab-item>
                <VendorContactsSublist :vendor="editedItem"  :contactTypeOptions="contactTypeOptions"/>
              </v-tab-item>
            </v-tabs>

          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-data-table id="vendor-table"
      :headers="headers"
      :items="vendors"
      hide-default-footer disable-pagination
      class="elevation-1 mx-1"
    >
      <template v-slot:item="{ item }">
       <tr @click="editItem(item)">
        <td class="d-flex justify-center align-center px-0">
          <v-btn icon >
          <v-icon
            medium
            @click.stop="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          </v-btn>
          <v-btn icon >
          <v-icon
            medium
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
          </v-btn>
        </td>
        <td>{{item.name}}</td>
        <td>{{item.vendorId}}</td>
        <td>{{item.componentsUrl}}</td>
       </tr>
      </template>
    </v-data-table>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import VendorContactsSublist from './VendorContactsSublist.vue'
import VendorAppsSublist from './VendorAppsSublist.vue'
import VendorComponentsSublist from './VendorComponentsSublist.vue'
  export default {
    components: {
      VendorContactsSublist,
      VendorAppsSublist,
      VendorComponentsSublist
    },
    data: () => ({
      dialog: false,
      valid: true,
      rules: {
          required: value => !!value || 'Required.',
          requiredObject: value => (value && value._id!='') || 'Required.',
          nonNegative: value => value >= 0 || 'Enter non-negative number.',
          url: (v) => {
            try {
              new URL(v);
              return true;
            } catch (e) {
              return 'Please enter a valid URL.'
            }
          } 
      },
      contactTypeOptions: ['Primary', 'Associate'],
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align:'left', sortable:true, value: 'name' },
        { text: 'Vendor Id', align:'left', sortable:true, value: 'vendorId' },
        { text: 'Comonents URL', align:'left', sortable:true, value: 'componentsUrl' }
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        vendorId: '',
        contacts: [],
        applications: []
      }

    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New Vendor' : 'Edit Vendor'
      },
      ...mapState(['vendors'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    created() {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.$store.commit('SET_CRUDAPISERVCE', 'vendors');
      this.$store.dispatch('loadRecords', 'vendors');
    },
    mounted () {
      EventBus.$on('vendors data refresh', () =>{
        this.$store.dispatch('loadRecords', 'vendors');
      })
    },

    methods: {
      displayItemToEdit() {
        this.dialog = true;
      },
      editItem (item) {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.editedIndex = this.vendors.indexOf(item);
        if (item._id) {
          this.$store.dispatch('readRecord', {model:'vendors', _id:item._id})
          .then((readItem)=>{
            this.editedItem = Object.assign({}, readItem);
            this.displayItemToEdit()
          })
        } else {
          this.editedItem = Object.assign({}, item);
          this.displayItemToEdit()
        }
      },

      deleteItem (item) {
        confirm('Are you sure you want to delete '+item.name+'?') && this.$store.dispatch('deleteRecord', {model:'vendors', dbObject:item, label:item.name});
      },

      cancel() {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.editedItem = {
            name: '',
            vendorId: '',
            contacts: [],
            applications: []
          }
          this.editedIndex = -1;
        }, 300)
      },

      save () {
        if (this.$refs.theForm.validate()) {
          ((this.editedIndex > -1)?
            this.$store.dispatch('updateRecord', {model:'vendors', label: this.editedItem.name, dbObject:this.editedItem}):
            this.$store.dispatch('createRecord', {model:'vendors', label: this.editedItem.name, dbObject:this.editedItem})).then((newRec)=> {
              if (newRec) {
                this.$store.commit('SET_SUCCESS', `${this.editedItem.name} ${this.editedIndex > -1?'updated':'added'}.`);
                this.dialog = false;
                this.$store.dispatch('loadRecords', 'vendors')
              }
            })
        }
      }
    }
  }
</script>

<style scoped>
#vendor-table >>> thead.v-data-table-header >>> th {
  font-size: 0.8em !important;
}
</style>
