<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>Organizations</v-toolbar-title>
      <v-divider
        class="mx-3"
        inset
        vertical
      ></v-divider>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" max-width="900px" overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Organization</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">{{ formTitle }}</span>
          </v-card-title>

          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
              <v-text-field :readonly="editedItem.organizationId=='cloudhaven'" v-model="editedItem.name" label="Name" required :rules="[rules.required]"></v-text-field>
              <v-text-field :readonly="editedItem.organizationId=='cloudhaven'" v-model="editedItem.organizationId" label="Id" required :rules="[rules.required]"></v-text-field>
              <v-text-field v-if="editedItem.organizationId!='cloudhaven'" v-model="editedItem.componentsUrl" label="Components URL" :rules="[rules.url]"></v-text-field>
            </v-form>
          </v-card-text>
              <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" >
              <v-tab v-if="editedItem.organizationId!='cloudhaven'" >Applications</v-tab>
              <v-tab v-if="editedItem.organizationId!='cloudhaven'" >Components</v-tab>
              <v-tab>Groups</v-tab>
              <v-tab>Contacts</v-tab>
              <v-tab-item v-if="editedItem.organizationId!='cloudhaven'">
                <OrganizationAppsSublist :organization="editedItem"/>
              </v-tab-item>
              <v-tab-item v-if="editedItem.organizationId!='cloudhaven'">
                <OrganizationComponentsSublist :organization="editedItem"/>
              </v-tab-item>
              <v-tab-item>
                <OrganizationGroups :organization="editedItem" />
              </v-tab-item>
              <v-tab-item>
                <OrganizationContactsSublist :organization="editedItem"  :contactTypeOptions="contactTypeOptions"/>
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
    <v-data-table id="organization-table"
      :headers="headers"
      :items="organizations"
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
          <v-icon v-if="item.organizationId!='cloudhaven'"
            medium
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
          </v-btn>
        </td>
        <td>{{item.name}}</td>
        <td>{{item.organizationId}}</td>
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
import OrganizationContactsSublist from './OrganizationContactsSublist.vue'
import OrganizationAppsSublist from './OrganizationAppsSublist.vue'
import OrganizationComponentsSublist from './OrganizationComponentsSublist.vue'
import OrganizationGroups from './OrganizationGroups.vue'
  export default {
    components: {
      OrganizationContactsSublist,
      OrganizationAppsSublist,
      OrganizationComponentsSublist,
      OrganizationGroups
    },
    data: () => ({
      dialog: false,
      valid: true,
      rules: {
          required: value => !!value || 'Required.',
          requiredObject: value => (value && value._id!='') || 'Required.',
          nonNegative: value => value >= 0 || 'Enter non-negative number.',
          url: (v) => {
            if (!v) return true;
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
        { text: 'Organization Id', align:'left', sortable:true, value: 'organizationId' },
        { text: 'Comonents URL', align:'left', sortable:true, value: 'componentsUrl' }
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        organizationId: '',
        contacts: [],
        applications: []
      }

    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New Organization' : 'Edit Organization'
      },
      ...mapState(['organizations'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    created() {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.$store.commit('SET_CRUDAPISERVCE', 'organizations');
      this.$store.dispatch('loadRecords', 'organizations');
    },
    mounted () {
      EventBus.$on('organizations data refresh', () =>{
        this.$store.dispatch('loadRecords', 'organizations');
      })
    },

    methods: {
      displayItemToEdit() {
        this.dialog = true;
      },
      editItem (item) {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.editedIndex = this.organizations.indexOf(item);
        if (item._id) {
          this.$store.dispatch('readRecord', {model:'organizations', _id:item._id})
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
        confirm('Are you sure you want to delete '+item.name+'?') && this.$store.dispatch('deleteRecord', {model:'organizations', dbObject:item, label:item.name});
      },

      cancel() {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.editedItem = {
            name: '',
            organizationId: '',
            contacts: [],
            applications: []
          }
          this.editedIndex = -1;
        }, 300)
      },

      save () {
        if (this.$refs.theForm.validate()) {
          ((this.editedIndex > -1)?
            this.$store.dispatch('updateRecord', {model:'organizations', label: this.editedItem.name, dbObject:this.editedItem}):
            this.$store.dispatch('createRecord', {model:'organizations', label: this.editedItem.name, dbObject:this.editedItem})).then((newRec)=> {
              if (newRec) {
                this.$store.commit('SET_SUCCESS', `${this.editedItem.name} ${this.editedIndex > -1?'updated':'added'}.`);
                this.dialog = false;
                this.$store.dispatch('loadRecords', 'organizations')
              }
            })
        }
      }
    }
  }
</script>

<style scoped>
#organization-table >>> thead.v-data-table-header >>> th {
  font-size: 0.8em !important;
}
</style>
