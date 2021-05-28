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
        <td>{{ item.memberCount }}</td>
        <!--td>{{ item.isPrimary | yesno}}</td-->
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="500px" scrollable  overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Group</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Group</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="groupForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required></v-text-field>
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
    props: ['organization'],
    data: () => ({
      dialog: false,
      valid: true,
      emailErrMsg: '',
      rules: { email: (v) => !v || /^[^@]+@[^.]+\..+$/.test(v) || 'Please enter a valid email.' },
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Members', align: 'right', sortable: true, value: 'memberCnt' }
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        memberCnt: 0
      }
    }),

    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
    },

    methods: {
      editItem (item) {
        this.editedIndex = this.organization.groups.findIndex((group) => {return group.name === item.name;});
        this.editedItem = Object.assign({
          name: '',
          memberCnt: 0
        }, item);
        this.dialog = true;
        this.emailErrMsg = '';
      },

      deleteItem (item) {
        const index = this.organization.groups.findIndex((group) => {return group.name === item.name;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationgroup/'+this.organization._id+'/'+item._id);
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
                this.organization.groups.splice(index, 1);
                this.$store.dispatch('loadRecords', 'organizations');
              } else if (response.data.errMsg) {
                this.$store.commit('SET_ERRMSG', response.data.errMsg);
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
          this.emailErrMsg = '';
          this.editedItem = {
            name: '',
            memberCnt: 0
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.groupForm.validate()) return;
        if (this.editedIndex > -1) {
          //update existing group
          (async () => {
            var response = await Api().put('/organizationgroup/'+this.organization._id+'/'+this.editedItem._id, this.editedItem);
            if (response.data.success) {
              this.$store.commit('SET_SUCCESS', `${this.editedItem.name} updated.`);
              Object.assign(this.organization.groups[this.editedIndex], this.editedItem)
              this.dialog = false;
            } else if (response.data.errMsg) {
              this.$store.commit('SET_ERRMSG', response.data.errMsg );
            }
          })();
        } else {
          //add new group
          if (this.organization._id) {
            (async () => {
              var response = await Api().post('/organizationgroup', {organizationId:this.organization._id, organizationGroup:this.editedItem});
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${this.editedItem.name} added.`);
                debugger;
                this.organization.groups = [].concat(response.data.newOrg.groups);
                this.dialog = false;
              } else if (response.data.errMsg) {
                this.$store.commit('SET_ERRMSG', response.data.errMsg);
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
