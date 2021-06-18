<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>Organizations</v-toolbar-title>
    </v-toolbar>
    <v-data-table v-if="!isAdmin" id="organization-table"
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
          <!--v-btn icon >
          <v-icon v-if="item.organization.organizationId!='cloudhaven'"
            medium
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
          </v-btn-->
        </td>
        <td>{{item.organization.isAdmin?'Yes':'No'}}
        <td>{{item.organization.name}}</td>
        <td>{{item.organization.organizationId}}</td>
        <td>{{item.organization.componentsUrl}}</td>
       </tr>
      </template>
    </v-data-table>
    <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" class="mt-5">
    <v-tab>Applications</v-tab>
    <v-tab>Components</v-tab>
    <!--v-tab>Groups</v-tab>
    <v-tab>Members</v-tab-->
    <v-tab-item>
      <OrganizationAppsSublist :key="key" :organization="activeOrg" @orgAppsChanged="orgAppsChanged"/>
    </v-tab-item>
    <v-tab-item>
      <OrganizationComponentsSublist :key="key" :organization="activeOrg" @orgCompsChanged="orgCompsChanged"/>
    </v-tab-item>
    <!--v-tab-item>
      <OrganizationGroups :organization="isAdmin?cloudHavenOrg:editedOrg.organization" />
    </v-tab-item>
    <v-tab-item>
      <OrganizationMembersSublist :organization="isAdmin?cloudHavenOrg:editedOrg.organization"/>
    </v-tab-item-->
  </v-tabs>

  <v-dialog v-model="dialog" max-width="900px" overlay-opacity="0.2">
    <v-card>
      <v-card-title>
        <span class="text-h5">Edit {{editedOrg.name}}</span>
      </v-card-title>

      <v-card-text>
        <v-form ref="theForm" v-model="valid" lazy-validation>
          <v-text-field :readonly="editedOrg.organization.organizationId=='cloudhaven'" v-model="editedOrg.organization.name" label="Name" required :rules="[rules.required]"></v-text-field>
          <v-text-field :readonly="editedOrg.organization.organizationId=='cloudhaven'" v-model="editedOrg.organization.organizationId" label="Id" required :rules="[rules.required]"></v-text-field>
          <v-text-field v-if="editedOrg.organization.organizationId!='cloudhaven'" v-model="editedOrg.organization.componentsUrl" label="Components URL" :rules="[rules.url]"></v-text-field>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Api from '@/services/Api'
import { EventBus } from '../event-bus.js';
import OrganizationMembersSublist from './OrganizationMembersSublist.vue'
import OrganizationAppsSublist from './OrganizationAppsSublist.vue'
import OrganizationComponentsSublist from './OrganizationComponentsSublist.vue'
import OrganizationGroups from './OrganizationGroups.vue'
  export default {
    components: {
      OrganizationMembersSublist,
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
/*      editedOrgId: '',
      editedOrg: {
        isAdmin: false,
        organization: {
          name: '',
          organizationId: '',
          contacts: [],
          applications: []
        }
      },*/
      myOrgMemberships: [],
      key: 1

    }),

    computed: {
      activeOrg() {
        return (this.isAdmin?this.cloudHavenOrg:this.editedOrg).organization;
      },
      isAdmin() {
        return this.user.rolesMap['SYSADMIN']!=null;
      },
      cloudHavenOrg() {
        var retOrg = this.user.orgMemberships.find(om=>{
          var match = om.organization.name=='CloudHaven';
          return match;
        });
        return retOrg;
      },
      editedOrg() {
        var retOrg = this.isAdmin?this.cloudHavenOrg:(this.myOrgMemberships.length>0?this.myOrgMemberships[0]:{organization:{}});
        return retOrg;
      },
/*      formTitle () {
        return this.editedIndex === -1 ? 'New Organization' : 'Edit Organization'
      },*/
      ...mapState([/*'organizations',*/ 'user'])
    },

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    created() {
      this.$store.dispatch('reloadUser')
      .then((user)=>{
        console.log('reloadUser:'+user);
        this.loadRecords();
      })
    },
    mounted () {
    },

    methods: {
      orgAppsChanged() {
        this.loadRecords();
      },
      orgCompsChanged() {
        this.loadRecords();
      },
      loadRecords() {
        this.key++;
        (async () => {
            var response = await Api().get('/organizationuser/currentuserorgs');
            if (response.data.success) {
              this.myOrgMemberships = [].concat(response.data.orgMemberships);
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg);
            }
        })();
      },
      editItem (item) {
//        this.editedOrgId = item._id;
//        this.editedOrg = Object.assign({}, item);
        this.dialog = true;
      },

/*      deleteItem (item) {
        if (confirm('Are you sure you want to delete '+item.organization.name+'?')) {
          //        } && this.$store.dispatch('deleteRecord', {model:'organizations', dbObject:item, label:item.name});
          alert('Delete not currently implemented.');
        }
      },*/

      cancel() {
        this.dialog = false;
      },
      close () {
/*        setTimeout(() => {
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
        }, 300)*/
      },

      save () {
        if (this.$refs.theForm.validate()) {
          (async () => {
              var response = await Api().post('/organizationuser/updateOrg', this.editedOrg.organization);
              if (response.data.success) {
                EventBus.$emit('global success alert', `Organization ${this.editedOrg.organization.name} updated.`);
                this.loadRecords();
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg);
              }
          this.dialog = false;
          })();
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
