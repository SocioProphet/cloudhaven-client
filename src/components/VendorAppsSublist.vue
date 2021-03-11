<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="vendor.applications"
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
        <td><v-img max-width="30" max-height="30" :src="item.logo" /></td>
        <td>{{ item.url}}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
      <v-dialog v-model="dialog" @keydown.esc.prevent="dialog = false" max-width="500px" scrollable>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New Application</v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="text-h5">Application</span>
          </v-card-title>
          <v-card-text>
          <v-alert
            :value="appErrMsg?true:false"
            dismissible
            type="error"
          >
            {{appErrMsg}}
          </v-alert>
            <v-form ref="appForm" v-model="valid" lazy-validation>
              <v-text-field v-model="editedItem.name" label="Name" required></v-text-field>
              <v-text-field v-model="editedItem.url" label="URL" required ></v-text-field>
              <v-row fill-height wrap class="pt-4" >
                <div style="width:100%" >
                  <span class="v-label v-label--active theme--light ml-3" >Logo</span>
                </div>
                <v-col sm="12" md="6" lg="6" class="pr-4">
                  <div style="position:relative;width:200px;height:200px">
                  <v-icon v-if="editedItem.logo" class="ma-1" style="z-index:100;position:absolute;top:0px;right:0px;" @click="removeLogo()">mdi-trash-can</v-icon>
                  <v-img width="200px" :src="dataURI"></v-img>
                  </div>
                </v-col>
                <v-col>
                  <v-sheet height="200" width="100%" color='#D0D0D0' 
                  style="position:relative" class="d-flex justify-center align-center ma-0 pa-2" >
                  <v-flex class="drop-files justify-center text-h5" style="text-align:center">Drop Logo here.</v-flex>
                  </v-sheet>
                </v-col>
              </v-row>
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
  import MultipartPostApi from '@/services/MultipartPostApi'
  export default {
    props: ['vendor'],
    data: () => ({
      dialog: false,
      appErrMsg:'',
      valid: true,
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Logo', align:'left', sortable:true, name:'logo'},
        { text: 'URL', align: 'left', sortable: true, name:'url'}
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        logo:null,
        url: ''
      },
      logoUpdated: false,
      dragAndDropCapable: false,
      currentLogoURI: null
    }),
    computed: {
      dataURI() {
        if (this.currentLogoURI) {
          return this.currentLogoURI;
        } else if (this.editedItem.logo) {
          var bytes = new Uint8Array(this.editedItem.logo.data);
          var binary = bytes.reduce((data, b) => data += String.fromCharCode(b), '');
          var data = "data:image/jpeg;base64," + btoa(binary);
          return data;
        } else {
          return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        }
      }
    },
    watch: {
      dialog (val) {
        val || this.close()
      }
    },

    mounted () {
    },

    methods: {
      prepDragNDrop() {
        //File drag-n-drop logic
        this.dragAndDropCapable = this.determineDragAndDropCapable();

        if( this.dragAndDropCapable ){
          ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach( function( evt ) {
            var refs = this.$refs;
            this.$refs.appForm.$el.addEventListener(evt, function(e){
              e.preventDefault();
              e.stopPropagation();
            }.bind(this), false);
          }.bind(this));

          this.$refs.appForm.$el.addEventListener('drop', function(e){
            this.editedItem.logo = e.dataTransfer.files[0];
            this.currentLogoURI = URL.createObjectURL( this.editedItem.logo );
            this.logoUpdated = true;
          }.bind(this));
        }
      },
      removeLogo() {
        this.editedItem.logo = null;
        this.currentLogoURI = null;
        this.logoUpdated = true;
      },
      determineDragAndDropCapable(){
        var div = document.createElement('div');
        var isOK =  ( ( 'draggable' in div )
          || ( 'ondragstart' in div && 'ondrop' in div ) )
          && 'FormData' in window
          && 'FileReader' in window;
         return isOK;
      },

      initialize () {
      },

      createFormData(operation) {
        var formData = new FormData();
        formData.append('operation', operation);
        formData.append('vendorId', this.vendor._id);
        formData.append('applicationId', this.editedItem._id);

        formData.append('logo', this.editedItem.logo);
        formData.append('logoUpdated', this.logoUpdated)
        formData.append('name', this.editedItem.name);
        formData.append('url', this.editedItem.url);
        return formData;
      },
      editItem (item) {
        if (!this.vendor.applications) this.vendor.applications = [];
        this.editedIndex = this.vendor.applications.findIndex((application) => {return application.name === item.name;});
        this.editedItem = Object.assign({
          name: '',
          logo:'',
          url: ''
        }, item);
        this.dialog = true;
        this.appErrMsg = '';
        setTimeout(()=>{
          this.prepDragNDrop();
          }, 500);
      },

      deleteItem (item) {
        const index = this.vendor.applications.findIndex((application) => {return application.name === item.name && application.contactType == item.contactType;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/vendorapplication/'+this.vendor._id+'/'+item._id);
              if (response.data.success) {
                this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
                this.vendor.applications.splice(index, 1);
                this.$store.dispatch('loadRecords', 'vendors');
                this.appErrMsg = '';
              } else if (response.data.errMsg) {
                this.appErrMsg = response.data.errMsg;
              }
            })();
          } else {
            this.vendor.applications.splice(index, 1);
          }
        }
      },

      close () {
        this.dialog = false;
        setTimeout(() => {
          this.appErrMsg = '';
          this.editedItem = {
            name: '',
          };
          this.editedIndex = -1
        }, 300)
      },

      save () {
        if (!this.$refs.appForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        if (operation == 'update' || this.vendor._id) {
          (async () => {
            var response = await MultipartPostApi().post('/vendorapplication', this.createFormData(operation));
            if (response.data.success) {
              this.$store.commit('SET_SUCCESS', `${this.editedItem.name} ${operation=='update'?'updated':'added'}.`);
              this.vendor.applications = response.data.applications;
              this.dialog = false;
              this.$store.dispatch('loadRecords', 'vendors')
              this.appErrMsg = '';
            } else if (response.data.errMsg) {
              this.appErrMsg = response.data.errMsg;
            }
          })();
        } else {
          this.vendor.applications.push(this.editedItem)
          this.dialog = false;
        }
      }
    }
  }
</script>

<style>
.dragTargetDiv {
   display: block;
    height: 100%;
    width: 100%;
    background: #ccc;
    margin: auto;
    margin-top: 10px;
    text-align: center;
    line-height: 200px;
    border-radius: 4px;
    font-size:18px;
}
</style>