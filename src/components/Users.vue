<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>Users</v-toolbar-title>
      <v-divider
        class="mx-3"
        inset
        vertical
      ></v-divider>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" max-width="500px" @keydown.esc.prevent="dialog = false"  overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New User</v-btn>
        </template>
        <v-card>
          <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
            <v-text-field v-if="editedItem.organization" readonly :value="editedItem.organization.name" label="Organization" ></v-text-field>
            <v-text-field v-model="editedItem.email" label="Email (username)" required :rules="[rules.required, rules.email]" ></v-text-field>
            <v-text-field v-model="editedItem.firstName" label="First Name" :rules="[rules.required]"></v-text-field>
            <v-text-field v-model="editedItem.middleName" label="Middle Name"></v-text-field>
            <v-text-field v-model="editedItem.lastName" label="Last Name" :rules="[rules.required]"></v-text-field>
            <component :is="'CHDateField'" :value="editedItem.dateOfBirth" @input="(value) => {editedItem.dateOfBirth = value}" :label="'Date of Birth'"></component>
            <v-text-field v-model="editedItem.ssn" label="Social Security Number" :rules="[rules.ssn]"></v-text-field>
            <v-text-field v-if="!editedItem._id" type="password" v-model="editedItem.password" label="Password"></v-text-field>
            <v-select v-model="editedItem.language" :items="['English', 'Spanish']" label="Language" :rules="[rules.required]"></v-select>
            <v-select v-if="!isOrganization" multiple :items="roleOptions" class="mb-0 pb-0" v-model="editedItem.roles" label="Roles"></v-select>
            <v-text-field v-if="isOrganization" readonly :value="'Organization'" label="Role"></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="dialog=false">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog v-model="pwdDialog" max-width="500px" @keydown.esc.prevent="pwdDialog = false" overlay-opacity="0.2">
        <v-card>
          <v-card-title><span class="text-h5">Change Password for {{chgPwdObj.name}}</span></v-card-title>
          <v-card-text>
            <v-form ref="pwdChgForm" v-model="pwdValid" lazy-validation>
            <v-text-field type="password" v-model="chgPwdObj.newPassword" label="New Password" required :rules="[rules.required]" ></v-text-field>
            <v-text-field type="password" :error-messages="confPwdErrMsg" v-model="chgPwdObj.newPassword2" label="Confirm Password" required :rules="[rules.required]" ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="savePwdChange"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-data-table
      :headers="headers"
      :items="users"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
       <tr @click="editItem(item)">
        <td>
          <v-row class="justify-center align-center align-stretch">
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
          </v-row>
        </td>
        <td align="center" class="pt-3"><a @click.stop="showChangePwdForm(item)">Change Password</a></td>
        <td class="pt-3">{{ item.email }}</td>
        <td class="pt-3">{{ item.name }}</td>
        <td class="pt-1">
          <span v-for="(role, i) in item.roles" :key="i"><br v-if="i!=0" />{{getRoleLabel(role)}}</span>
        </td>
       </tr>
      </template>
    </v-data-table>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import CHDateField from './CHDateField'
import Api from '@/services/Api'
  export default {
    components: {
      CHDateField
    },
    data: () => ({
      dialog: false,
      pwdDialog: false,
      valid: true,
      pwdValid: true,
      confPwdErrMsg:'',
      rules: {
          required: value => !!value || 'Required.',
          email: (v) => /^[^@]+@[^.]+\..+$/.test(v) || 'Please enter a valid email.',
          ssn: (v) => !v || /^\d{3}-?\d{2}-?\d{4}$/.test(v) || 'Please enter a valid SSN.',
      },
      headers: [
        { text: 'Actions', sortable: false, align:'center' },
        { text: 'Change Password', sortable: false, align:'center' },
        { text: 'Email', align: 'left', sortable: true, value: 'email' },
        { text: 'Name', align:'left', sortable:true, value: 'name' },
        { text: 'Roles', align:'left', sortable:true, value: 'roles' }
      ],
      editedIndex: -1,
      editedItem: {
        email: '',
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: null,
        ssn: '',
        password: '',
        language: 'English',
        roles:[]
      },
      chgPwdObj:{},
      roleOptions: [
          {value:'SYSADMIN', text:'Administrator'},
          {value:'USER', text:'User'}
      ]

    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New User' : 'Edit User'
      },
      ...mapState(['users']),
      isOrganization() {
        return this.editedItem.roles?this.editedItem.roles.find(r=>(r=='ORGANIZATION'))!=null:false;
      }
    },

    watch: {
      dialog (val) {
        if (!val) {
          this.close()
        }
      },
      pwdDialog (val) {
        if (!val) {
          this.closePwdDlg()
        }
      }
    },

    created () {
      this.$store.commit('SET_CRUDAPISERVCE', 'users');
      this.$store.dispatch('loadRecords', 'users');
      EventBus.$on('users data refresh', () =>{
        this.$store.dispatch('loadRecords', 'users');
      })
    },

    methods: {
      getRoleLabel( roleValue ) {
        for (var i=0;i<this.roleOptions.length;i++) {
          if (this.roleOptions[i].value == roleValue) {
            return this.roleOptions[i].text;
          }
        }
        return 'NOTFOUND';
      },
      showChangePwdForm( user ) {
        this.chgPwdObj = {_id:user._id, name:user.name};
        this.pwdDialog = true;
      },
      editItem (item) {
        this.editedIndex = this.users.indexOf(item)
        this.editedItem = Object.assign({}, item)
        if (!this.editedItem._id) {
          this.$refs.form.reset()
        }
        this.dialog = true
      },

      deleteItem (item) {
        confirm('Are you sure you want to delete '+item.name+'?') && this.$store.dispatch('deleteRecord', {model:'users', dbObject:item, label:`User ${this.editedItem.lastName}`});
      },

      cancel() {
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.editedItem = {email: '', firstName: '', middleName:'', lastName:'', password: '', language: 'English', roles:[] }
          this.editedIndex = -1
        }, 300)
      },

      closePwdDlg () {
        setTimeout(() => {
          this.chgPwdObj = {}
        }, 300)
      },
      savePwdChange() {
        this.confPwdErrMsg = '';
        if (this.chgPwdObj.newPassword != this.chgPwdObj.newPassword2) {
          this.confPwdErrMsg = 'Confirmation password does not match.';
          return;
        }
        if (!this.$refs.pwdChgForm.validate()) return;
        (async () => {
          var response = await Api().post('/chgpwd', this.chgPwdObj );
          if (response.data.success) {
            EventBus.$emit('global success alert', `Password for ${this.chgPwdObj.name} updated.`)
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg)
          }
          this.pwdDialog = false;
        })();
      },
      save () {
        if (!this.$refs.theForm.validate()) return;
        ((this.editedIndex > -1)?
          this.$store.dispatch('updateRecord', {model:'users', dbObject:this.editedItem, label:`User ${this.editedItem.lastName}`}):
          this.$store.dispatch('createRecord', {model:'users', dbObject:this.editedItem, label:`User ${this.editedItem.lastName}`})).then((newRec)=> {
              if (newRec) {
                EventBus.$emit('global success alert', `${this.editedItem.lastName} ${this.editedIndex > -1?'updated':'added'}.`);
                this.dialog = false;
                this.$store.dispatch('loadRecords', 'users')
              }
          })
      }
    }
  }
</script>