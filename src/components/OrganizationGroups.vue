<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="organization.groups"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
        <tr @click="editItem(item)">
        <td class="d-flex justify-space-around align-center px-0">
          <v-icon class="mr-3" @click.stop="editItem(item)">mdi-pencil</v-icon>
          <v-icon @click.stop="deleteItem(item)">mdi-trash-can</v-icon>
        </td>
        <td>{{ item.name }}</td>
        <td align="right">{{ item.members.length }}</td>
        <!--td>{{ item.isPrimary | yesno}}</td-->
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="700px" scrollable  overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Group</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Group</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="groupForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required :rules="[rules.required]"></v-text-field>
            </v-form>
              <v-data-table :headers="groupMembersHeaders" :items="editedItem.members" hide-default-footer disable-pagination class="elevation-1" >
                <template v-slot:top>
                  <v-container>
                    <v-row style="flex-wrap: nowrap; overflow-x: auto;" class="mb-2">
                      <v-text-field v-model="memberSearchFilter" label="New Member Search Filter" @input="onSearchFilterChange"
                        persistent-hint hint="Space-separated phrases to be searched in email/first name/last name." class="mr-2"></v-text-field>
                      <v-select v-model="selectedMember" :label="memberSearchFilter?'Select Member':''" :items="memberOptions" item-value="_id" item-text="name" return-object @change="addMember"/>
                    </v-row>
                  </v-container>
                </template>
                <template v-slot:item="{ item }">
                  <tr @click="editItem(item)">
                  <td class="d-flex justify-center align-center px-0">
                    <v-icon @click.stop="deleteMember(item)" >mdi-trash-can</v-icon>
                  </td>
                  <td>{{ item.name }}</td>
                  </tr>
                </template>
              </v-data-table>
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
                    <!--v-dialog v-model="dialogDelete" max-width="500px">
                      <v-card>
                        <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
                        <v-card-actions>
                          <v-spacer></v-spacer>
                          <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
                          <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>
                          <v-spacer></v-spacer>
                        </v-card-actions>
                      </v-card>
                    </v-dialog-->
  </div>
</template>

<script>
  import Api from '@/services/Api'
  import { EventBus } from '../event-bus.js';
  import { mapState } from 'vuex'
  export default {
    props: ['organization'],
    data() {
      return {
        memberSearchFilter:'',
        selectedMember: null,
        memberOptions: [],
        dialog: false,
        valid: true,
        rules: {
          required: value => !!value || 'Required.',
          email: (v) => !v || /^[^@]+@[^.]+\..+$/.test(v) || 'Please enter a valid email.'
          },
        headers: [
          { text: 'Actions', value: 'name', sortable: false, align:'center', width:"120px" },
          { text: 'Name', align: 'left', sortable: true, value: 'name' },
          { text: 'Members', align: 'right', sortable: true, value: 'memberCnt' }
        ],
        groupMembersHeaders: [
          { text: 'Actions', value: 'name', sortable: false, align:'center', width:"120px" },
          { text: 'Member', align: 'left', sortable: true, value: 'name' }
        ],
        editedIndex: -1,
        editedItem: {
          name: '',
          members:[]
        }
      }
    },

    computed: {
      ...mapState(['user'])
    },
    watch: {
      dialog (val) {
        this.memberSearchFilter = '',
        this.selectedMember = null,
        this.memberOptions = []
        val || this.close()
      }
    },

    mounted () {
      debugger;
      var org = this.organization;
      var x = '';
    },

    methods: {
      onSearchFilterChange() {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
          this.fetchMemberOptions();
        }, 500);
      },
      fetchMemberOptions() {
        (async () => {
          var response = await Api().post('/usersearch/emailnamesearch', {searchPhrase:this.memberSearchFilter});
          if (response.data) {
            this.memberOptions = response.data || [];
          }
        })();

      },
      openAddMemberDlg() {
        this.memberSearchFilter = '',
        this.selectedMember = null,
        this.memberOptions = []
      },
      addMember() {
        if (this.selectedMember && this.selectedMember._id) {
          if (!this.editedItem._id) {
            this.editedItem.members.push(this.selectedMember);
          }
        }
        this.memberSearchFilter = '',
        this.selectedMember = null,
        this.memberOptions = []
      },
      deleteMember(item) {
        this.editedItem.members = this.editedItem.members.filter(m=>(m._id!=item._id));
      },
      editItem (item) {
        debugger;
        this.editedIndex = this.organization.groups.findIndex((group) => {return group._id === item._id;});
        this.editedItem = Object.assign({
          name: '',
          members:[]
        }, item);
        this.dialog = true;
      },

      deleteItem (item) {
        const index = this.organization.groups.findIndex((group) => {return group._id === item._id;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationgroup/'+this.organization._id+'/'+item._id);
              if (response.data.success) {
                EventBus.$emit('global success alert', `${item.name} deleted.`);
                this.organization.groups.splice(index, 1);
                this.$store.dispatch('loadRecords', 'organizations');
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg);
              }
            })();
          } else {
            this.organization.groups.splice(index, 1);
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.editedItem = {
            name: '',
            members:[]
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.groupForm.validate()) return;
        debugger;
        if (this.editedIndex > -1) {
          //update existing group
          (async () => {
            var response = await Api().put('/organizationgroup/'+this.organization._id+'/'+this.editedItem._id, this.editedItem);
            if (response.data.success) {
              EventBus.$emit('global success alert', `${this.editedItem.name} updated.`);
              Object.assign(this.organization.groups[this.editedIndex], this.editedItem)
              this.dialog = false;
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            }
          })();
        } else {
          //add new group
          if (this.organization._id) {
            (async () => {
              var response = await Api().post('/organizationgroup', {organizationId:this.organization._id, organizationGroup:this.editedItem});
              if (response.data.success) {
                EventBus.$emit('global success alert', `${this.editedItem.name} added.`);
                this.organization.groups = [].concat(response.data.newOrg.groups);
                this.dialog = false;
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg);
              }
            })();
          } else {
            this.organization.groups.push(this.editedItem)
            this.dialog = false;
          }
        }
      }
    }
  }
</script>
