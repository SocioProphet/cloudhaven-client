<template>
  <v-sheet>
  <v-data-table
    :headers="headers"
    :items="dataTableList"
    sort-by="name"
    class="elevation-1"
  >
    <template v-slot:top>
      <v-toolbar flat >
        <v-spacer></v-spacer>
        <v-dialog
          v-model="dialog"
          max-width="500px"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="primary"
              dark
              class="mb-2"
              v-bind="attrs"
              v-on="on"
            >
              New {{titleName}}
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                    <v-text-field
                      v-model="editedItem.name"
                      label="Name"
                    ></v-text-field>
                    <v-text-field v-if="arrayName=='props'"
                      v-model="editedItem.dataType"
                      label="Type"
                    ></v-text-field>
                    <v-text-field v-if="arrayName=='props'"
                      v-model="editedItem.defaultValue"
                      label="Default"
                    ></v-text-field>
                    <v-textarea v-model="editedItem.description" rows="3" auto-grow label="Description" ></v-textarea>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="blue darken-1"
                text
                @click="close"
              >
                Cancel
              </v-btn>
              <v-btn
                color="blue darken-1"
                text
                @click="save"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Are you sure you want to delete this {{titleName.toLowerCase()}}?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closeDelete">Cancel</v-btn>
              <v-btn color="blue darken-1" text @click="deleteItemConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon
        small
        class="mr-2"
        @click="editItem(item)"
      >
        mdi-pencil
      </v-icon>
      <v-icon
        small
        @click="deleteItem(item)"
      >
        mdi-delete
      </v-icon>
    </template>
  </v-data-table>
  </v-sheet>
</template>

<script>
  export default {
    props: {
      component: {type: Object, required:true},
      arrayName: { type: String, required:true}
    },
    data: () => ({
      dialog: false,
      dialogDelete: false,
      propsHeaders: [
        { text: 'Name', align: 'start', sortable: true, value: 'name'},
        { text: 'Type', align: 'start', sortable: true, value: 'dataType' },
        { text: 'Default', align: 'start', sortable: true, value: 'defaultValue' },
        { text: 'Description', align: 'start', sortable: true, value: 'description' },
        { text: 'Actions', value: 'actions', sortable: false }      ],
      otherHeaders: [
        { text: 'Name', align: 'start', sortable: true, value: 'name'},
        { text: 'Description', align: 'start', sortable: true, value: 'description' },
        { text: 'Actions', value: 'actions', sortable: false }      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        dataType: '',
        defaultValue: '',
        description: ''
      },
      defaultItem: {
        name: '',
        dataType: '',
        defaultValue: '',
        description: ''
      },
    }),

    computed: {
      headers() {
        return this.arrayName == 'props'?this.propsHeaders:this.otherHeaders;
      },
      dataTableList() {
        var retList = this.component[this.arrayName];
        return retList;
      },
      titleName() {
        var mp = {props:'Property', slots:'Slot', events:'Event'};
        return mp[this.arrayName];
      },
      formTitle () {
        return this.editedIndex === -1 ? `New ${this.titleName}` : `Edit ${this.titleName}`
      },
    },

    watch: {
      dialog (val) {
        val || this.close()
      },
      dialogDelete (val) {
        val || this.closeDelete()
      },
    },

    methods: {
      editItem (item) {
        this.editedIndex = this.component[this.arrayName].indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialog = true
      },

      deleteItem (item) {
        this.editedIndex = this.component[this.arrayName].indexOf(item)
        this.editedItem = Object.assign({}, item)
        this.dialogDelete = true
      },

      deleteItemConfirm () {
        this.component[this.arrayName].splice(this.editedIndex, 1)
        this.closeDelete()
      },

      close () {
        this.dialog = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      closeDelete () {
        this.dialogDelete = false
        this.$nextTick(() => {
          this.editedItem = Object.assign({}, this.defaultItem)
          this.editedIndex = -1
        })
      },

      save () {
        if (this.editedIndex > -1) {
          Object.assign(this.component[this.arrayName][this.editedIndex], this.editedItem)
        } else {
          this.component[this.arrayName].push(this.editedItem)
        }
        this.close()
      },
    },
  }
</script>