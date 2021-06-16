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
        <!--td>{{ item.isPrimary | yesno}}</td-->
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="500px" scrollable overlay-opacity="0.2">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">Add Member</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Add Member</span>
          </v-card-title>
          <v-card-text>
            <v-form ref="memberForm" v-model="valid" lazy-validation>
              <H1>TBD</H1>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="dialog=false">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-account-plus-outline</v-icon>Add</v-btn>
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
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Email', align: 'left', sortable: true, name:'contactInfo.email'}
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
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
        this.editedIndex = this.organization.contacts.findIndex((contact) => {return contact.name === item.name && contact.contactType == item.contactType;});
        this.editedItem = Object.assign({
          name: '',
        }, item);
        this.dialog = true;
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
              } else if (response.data.errMsg) {
              }
            })();
          } else {
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.editedItem = {
            name: '',
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.memberForm.validate()) return;
        if (this.editedIndex > -1) {
          //update existing contact
          (async () => {
            var response = await Api().put('/organizationuser/'+this.organization._id+'/'+this.editedItem._id, this.editedItem);
            if (response.data.success) {
              EventBus.$emit('global success alert', response.data.errMsg);
              this.$store.commit('SET_SUCCESS', `${this.editedItem.name} updated.`);
              Object.assign(this.organization.contacts[this.editedIndex], this.editedItem)
              this.dialog = false;
              this.$store.dispatch('loadRecords', 'organizations');
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg);
            }
          })();
        } else {
          //add new contact
          if (this.organization._id) {
            (async () => {
              var response = await Api().post('/organizationuser', {organizationId:this.organization._id, organizationContact:this.editedItem});
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${this.editedItem.name} added.`);
                this.organization.contacts = response.data.contacts;
                this.dialog = false;
              } else if (response.data.errMsg) {
              }
            })();
          } else {
            this.dialog = false;
          }
        }
      }
    }
  }
</script>
