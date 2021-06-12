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
              <v-text-field :readonly="editedOrg.organization.organizationId=='cloudhaven'" v-model="editedOrg.organization.name" label="Name" required :rules="[rules.required]"></v-text-field>
              <v-text-field :readonly="editedOrg.organization.organizationId=='cloudhaven'" v-model="editedOrg.organization.organizationId" label="Id" required :rules="[rules.required]"></v-text-field>
              <v-text-field v-if="editedOrg.organization.organizationId!='cloudhaven'" v-model="editedOrg.organization.componentsUrl" label="Components URL" :rules="[rules.url]"></v-text-field>
            </v-form>
          </v-card-text>
              <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" >
              <v-tab v-if="editedOrg.organization.organizationId!='cloudhaven'" >Applications</v-tab>
              <v-tab v-if="editedOrg.organization.organizationId!='cloudhaven'" >Components</v-tab>
              <v-tab>Groups</v-tab>
              <v-tab>Contacts</v-tab>
              <v-tab-item v-if="editedOrg.organization.organizationId!='cloudhaven'">
                <OrganizationAppsSublist :organization="editedOrg.organization" @orgAppsChanged="orgAppsChanged"/>
              </v-tab-item>
              <v-tab-item v-if="editedOrg.organization.organizationId!='cloudhaven'">
                <OrganizationComponentsSublist :organization="editedOrg.organization"/>
              </v-tab-item>
              <v-tab-item>
                <OrganizationGroups :organization="editedOrg.organization" />
              </v-tab-item>
              <v-tab-item>
                <OrganizationContactsSublist :organization="editedOrg.organization"  :contactTypeOptions="contactTypeOptions"/>
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
      :items="myOrgMemberships"
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
          <v-icon v-if="item.organization.organizationId!='cloudhaven'"
            medium
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
          </v-btn>
        </td>
        <td>{{item.organization.isAdmin?'Yes':'No'}}
        <td>{{item.organization.name}}</td>
        <td>{{item.organization.organizationId}}</td>
        <td>{{item.organization.componentsUrl}}</td>
       </tr>
      </template>
    </v-data-table>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Api from '@/services/Api'
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
        { text: 'Is Admin', align:'left', sortable:true, value: 'isAdmin' },
        { text: 'Name', align:'left', sortable:true, value: 'organization.name' },
        { text: 'Organization Id', align:'left', sortable:true, value: 'organization.organizationId' },
        { text: 'Comonents URL', align:'left', sortable:true, value: 'organization.componentsUrl' }
      ],
      editedOrgId: '',
      editedOrg: {
        isAdmin: false,
        organization: {
          name: '',
          organizationId: '',
          contacts: [],
          applications: []
        }
      },
      myOrgMemberships: []

    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New Organization' : 'Edit Organization'
      },
      ...mapState(['organizations', 'user'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    created() {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.loadRecords();
    },
    mounted () {
      EventBus.$on('organizations data refresh', () =>{
        this.loadRecords();
      })
    },

    methods: {
      orgAppsChanged(apps) {
        this.editedItem.applications = [].concat(apps);
        this.loadRecords();
      },
      loadRecords() {
        if (this.user.rolesMap['SYSADMIN']) {
          this.$store.commit('SET_CRUDAPISERVCE', 'organizations');
          this.$store.dispatch('loadRecords', 'organizations');
        } else {
          (async () => {
              var response = await Api().get('/organizationuser/currentuserorgs');
              if (response.data.success) {
                this.myOrgMemberships = [].concat(response.data.orgMemberships);
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg);
              }
          })();
        }
      },
      displayItemToEdit() {
        this.dialog = true;
      },
      editItem (item) {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.editedOrgId = item._id;
        this.editedOrg = Object.assign({}, item);
        this.displayItemToEdit()
      },

      deleteItem (item) {
        if (confirm('Are you sure you want to delete '+item.organization.name+'?')) {
          //        } && this.$store.dispatch('deleteRecord', {model:'organizations', dbObject:item, label:item.name});
          alert('Delete not currently implemented.');
        }
      },

      cancel() {
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.editedOrg = {
            isAdmin: false,
            organization: {
              name: '',
              organizationId: '',
              contacts: [],
              applications: []
            }
          }
          this.editedOrgId = '';
        }, 300)
      },

      save () {
        if (this.$refs.theForm.validate()) {
          ((this.editedOrgId)?
            this.$store.dispatch('updateRecord', {model:'organizations', label: this.editedOrg.organization.name, dbObject:this.editedOrg}):
            this.$store.dispatch('createRecord', {model:'organizations', label: this.editedOrg.organization.name, dbObject:this.editedOrg})).then((newRec)=> {
              if (newRec) {
                EventBus.$emit('global success alert', `${this.editedOrg.organization.name} ${this.editedOrgId?'updated':'added'}.`);
                this.dialog = false;
                this.loadRecords();
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
