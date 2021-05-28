<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="organization.contacts"
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
        <td>{{ item.contactType }}</td>
        <td>{{ item.contactInfo.phone | formattedPhone}}</td>
        <!--td>{{ item.isPrimary | yesno}}</td-->
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="500px" scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Contact</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Contact</span>
          </v-card-title>
          <v-card-text>
          <v-alert
            :value="contactErrMsg?true:false"
            dismissible
            type="error"
          >
            {{contactErrMsg}}
          </v-alert>
            <v-form ref="contactForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required></v-text-field>
              <v-select v-model="editedItem.contactType" :items="contactTypeOptions" label="Contact Type" required></v-select>
              <!--v-switch label="Is Primary" v-model="editedItem.isPrimary"></v-switch-->
              <v-row>
                <v-switch label="Is Active" v-model="editedItem.contactInfo.isActive"></v-switch>
                <v-switch label="Login Access" v-model="editedItem.hasLoginAccess"></v-switch>
              </v-row>
              <!--v-select v-model="editedItem.contactInfo.preferredContactMethod" :items="['Phone', 'Email']" label="Preferred Contact Method" required></v-select-->
              <v-text-field v-model="editedItem.contactInfo.phone" label="Phone" required  :mask="(editedItem.contactInfo.phone||'').length>7?'(###) ###-####':'###-#### #'"></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.email" label="Email" :rules="[rules.email]" :error-messages="emailErrMsg" @change="emailErrMsg=''"></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.fax" label="Fax" required :mask="(editedItem.contactInfo.fax||'').length>7?'(###) ###-####':'###-#### #'"></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.textPhone" label="Mobile" required :mask="(editedItem.contactInfo.textPhone||'').length>7?'(###) ###-####':'###-#### #'"></v-text-field>
              <!--v-text-field v-model="editedItem.contactInfo.attn" label="Attention" required></v-text-field-->
              <v-text-field v-model="editedItem.contactInfo.streetAddress" label="Street Address" required></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.city" label="City" required></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.stateOrProvince" label="State/Province" required  v-mask="'AA'"></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.zipOrPostalCode" label="Zip/Postal Code" @change="onZipChange" required></v-text-field>
              <v-text-field v-model="editedItem.contactInfo.country" label="Country" required></v-text-field>
              <!--v-select v-model="editedItem.contactInfo.language" :items="['English', 'Spanish']" label="Language" required></v-select-->
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
    props: ['organization', 'contactTypeOptions'],
    data: () => ({
      dialog: false,
      contactErrMsg:'',
      valid: true,
      emailErrMsg: '',
      rules: { email: (v) => !v || /^[^@]+@[^.]+\..+$/.test(v) || 'Please enter a valid email.' },
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        {
          text: 'Name',
          align: 'left',
          sortable: true,
          value: 'name'
        },
        {text: 'Contact Type', align:'left', sortable:true, name:'contactType'},
        { text: 'Phone', align: 'left', sortable: true, name:'contactInfo.phone'}
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        contactType:'',
        hasLoginAccess: false,
//        isPrimary: false,
        contactInfo: {
          city: '',
          stateOrProvince: '',
          isActive: true,
          language: 'English',
          country:'USA'
        }
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

      onZipChange() {
        this.$store.commit('SET_RESULTNOTIFICATION', '')
        var zip = this.editedItem.contactInfo.zipOrPostalCode;
        if (zip.length<5) return;
        (async () => {
            var response = await Api().get('/citystatelookup/'+zip);
            if (!response.data) return;
            if (response.data.errMsg) {
              this.$store.commit('SET_ERRMSG', response.data.errMsg);
            } else {
              var cityState = response.data;
              this.editedItem.contactInfo.city = cityState.city;
              this.editedItem.contactInfo.stateOrProvince = cityState.state;
            }
        })();
      },
      editItem (item) {
        this.editedIndex = this.organization.contacts.findIndex((contact) => {return contact.name === item.name && contact.contactType == item.contactType;});
        this.editedItem = Object.assign({
          name: '',
          contactType:'',
          hasLoginAccess: false,
  //        isPrimary: false,
          contactInfo: {
            city: '',
            stateOrProvince: '',
            isActive: true,
            language: 'English',
            country:'USA'
          }
        }, item);
        this.dialog = true;
        this.emailErrMsg = '';
        this.contactErrMsg = '';
      },

      deleteItem (item) {
        const index = this.organization.contacts.findIndex((contact) => {return contact.name === item.name && contact.contactType == item.contactType;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationcontact/'+this.organization._id+'/'+item._id);
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
                this.organization.contacts.splice(index, 1);
                this.$store.dispatch('loadRecords', 'organizations');
                this.contactErrMsg = '';
              } else if (response.data.errMsg) {
                this.contactErrMsg = response.data.errMsg;
              }
            })();
          } else {
            this.organization.contacts.splice(index, 1);
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.emailErrMsg = '';
          this.contactErrMsg = '';
          this.editedItem = {
            name: '',
            contactType:'',
            hasLoginAccess: false,
    //        isPrimary: false,
            contactInfo: {
              city: '',
              stateOrProvince: '',
              isActive: true,
              language: 'English',
              country:'USA'
            }
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.contactForm.validate()) return;
        if (this.editedItem.hasLoginAccess && !this.editedItem.contactInfo.email) {
          this.emailErrMsg = 'Required when login access enabled.';
          return;
        }
        if (this.editedIndex > -1) {
          //update existing contact
          (async () => {
            var response = await Api().put('/organizationcontact/'+this.organization._id+'/'+this.editedItem._id, this.editedItem);
            if (response.data.success) {
              this.$store.commit('SET_SUCCESS', `${this.editedItem.name} updated.`);
              Object.assign(this.organization.contacts[this.editedIndex], this.editedItem)
              this.dialog = false;
              this.$store.dispatch('loadRecords', 'organizations');
              this.contactErrMsg = '';
            } else if (response.data.errMsg) {
              this.contactErrMsg = response.data.errMsg;
            }
          })();
        } else {
          //add new contact
          if (this.organization._id) {
            (async () => {
              var response = await Api().post('/organizationcontact', {organizationId:this.organization._id, organizationContact:this.editedItem});
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${this.editedItem.name} added.`);
                this.organization.contacts = response.data.contacts;
                this.dialog = false;
                this.$store.dispatch('loadRecords', 'organizations')
                this.contactErrMsg = '';
              } else if (response.data.errMsg) {
                this.contactErrMsg = response.data.errMsg;
              }
            })();
          } else {
            this.organization.contacts.push(this.editedItem)
            this.dialog = false;
          }
        }
      }
    }
  }
</script>
