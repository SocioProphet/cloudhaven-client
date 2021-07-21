<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="applications"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:top>
        <div class="d-flex justify-space-between">
          <v-spacer></v-spacer>
          <v-text-field style="max-width:400px" v-model="searchFilter" label="Search Filter" single-line dense @input=""/>
        </div>
      </template>
      <template v-slot:item="{ item }">
        <tr @click="editItem(item)">
        <td class="d-flex justify-center align-center px-0">
          <v-icon
            class="mr-3"
            @click.stop="editItem(item)"
          >
            mdi-pencil
          </v-icon>
          <v-icon
            @click.stop="deleteItem(item)"
          >
            mdi-trash-can
          </v-icon>
        </td>
        <!--td v-if="isAdmin">{{item.organizationName}}</td-->
        <td v-if="isAdmin">{{item.organizationId}}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.applicationId }}</td>
        <!--td><v-img max-width="30" max-height="30" :src="item.logo" /></td-->
        <td>{{ item.source=='CloudHaven'?'CloudHaven':(item.url?item.url.substring(0,10)+'...':'')}}</td>
        <td>{{ item.status}}</td>
        <td v-if="isAdmin">{{item.isApproved?'APPROVED':''}}</td>
        </tr>
      </template>
      <template v-slot:[`body.append`]>
          <v-btn color="primary" dark class="mb-3" @click.native="editItem()">New Application</v-btn>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" @keydown.esc.stop="close(true)" max-width="500px" scrollable overlay-opacity="0.2" @click:outside="close(true)">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{editedItem._id?'Edit':'Add'}} Application</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="appForm" v-model="valid" lazy-validation>
            <v-text-field v-model="editedItem.name" label="Name" required :rules="[rules.required]"></v-text-field>
            <v-text-field v-model="editedItem.applicationId" label="Application Id" required :rules="[rules.required]"></v-text-field>
            <v-radio-group v-model="editedItem.source" row label="Source">
              <v-radio label='App Server' value='App Server'></v-radio>
              <v-radio label='CloudHaven' value='CloudHaven'></v-radio>
            </v-radio-group>
            <v-text-field v-if="editedItem.source=='App Server'" v-model="editedItem.url" label="URL" required :rules="editedItem.source=='App Server'?[rules.required]:[]"></v-text-field>
            <v-radio-group v-model="editedItem.status" row label="Status">
              <v-radio label='Draft' value='Draft'></v-radio>
              <v-radio label='Published' value='Published'></v-radio>
            </v-radio-group>
            <v-tabs dark fixed-tabs background-color="#1E5AC8" color="#FFF10E" >
            <v-tab>Pages</v-tab>
            <v-tab>Logo</v-tab>
            <v-tab-item>
              <AppPagesSublist :organizationId="organization._id" :application="editedItem" @pagesChanged="onPagesChanged"/>
            </v-tab-item>
            <v-tab-item>
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
            </v-tab-item>
          </v-tabs>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-btn elevation="2" color="blue darken-1" text @click.native.stop="close">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import Api from '@/services/Api'
  import { EventBus } from '../event-bus.js';
  import MultipartPostApi from '@/services/MultipartPostApi'
  import AppPagesSublist from './AppPagesSublist.vue'
  export default {
    props: ['organization'],
    components: {AppPagesSublist},
    data: () => ({
      dialog: false,
      valid: true,
      searchFilter:'',
      rawHeaders: [
        { text: 'Actions', value: 'name', sortable: false, align:'center', width:"80px" },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Application Id', align: 'left', sortable: true, value: 'applicationId' },
       // { text: 'Logo', align:'left', sortable:true, name:'logo'},
        { text: 'Source', align: 'left', sortable:true, name: 'source'},
        { text: 'Status', align: 'left', sortable:true, name: 'status'}
      ],
      rules: {
          required: value => !!value || 'Required.',
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
      editedIndex: -1,
      editedItem: {
        name:'',
        applicationId:'',
        source: 'CloudHaven',
        logo:null,
        url:'',
        status: 'Draft',
        pages:[]
      },
      defaultApp: {
        name: '',
        applicationId:'',
        source: 'CloudHaven',
        logo:null,
        url: 'http://',
        status: 'Draft',
        pages: []
      },
      logoUpdated: false,
      dragAndDropCapable: false,
      currentLogoURI: null,
      pagesChanged: false
    }),
    computed: {
      headers() {
        if (this.isAdmin) {
          var hdrs = [].concat(this.rawHeaders);
//          hdrs.splice(1,0, { text: 'Organization', align: 'left', sortable: true, value: 'organizationName' });
          hdrs.splice(1,0, { text: 'Organization Id', align: 'left', sortable: true, value: 'organizationId' });
          hdrs.push({ text: 'Approved', align:'left', sortable:true, value: 'isApproved'});
          return hdrs;
        } else {
          return this.rawHeaders;
        }
      },
      applications() {
        var apps = [];
        if (this.isAdmin) {
          apps = this.organizations.reduce((ar,org)=>{
            org.applications.forEach(a=>{
              var app = Object.assign({organizationName:org.name, organizationId:org.organizationId}, a);
              ar.push(app);
            })
            return ar;
          },[]);
          apps = apps.sort((a,b)=>{
            var aKey = a.organizationName+'-'+a.name;
            var bKey = b.organizationName+'-'+b.name;
            return aKey<bKey?-1:(aKey>bKey?1:0);
          });
        } else {
          apps = this.organization.applications;
        }
        return this.searchFilter?apps.filter(app=>(app.name.indexOf(this.searchFilter)>=0 || app.applicationId.indexOf(this.searchFilter)>=0)):apps;
      },
      isAdmin() {
        return this.user.rolesMap['SYSADMIN'];
      },
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
      },
      ...mapState(['organizations','user'])
    },
    watch: {
    },

    mounted () {
      this.valid = true;
      this.pagesChanged = false;
      if (this.isAdmin) {
        this.$store.commit('SET_CRUDAPISERVCE', 'organizations');
        this.loadOrganizations();
      }
    },

    methods: {
      loadOrganizations() {
        this.$store.dispatch('loadRecords', 'organizations');
      },
      onPagesChanged( pages ) {
        this.editedItem.pages = [].concat(pages);
        this.pagesChanged = true;
/*        if (!this.isAdmin) {
          this.loadOrganizations();
        }*/
      },
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

      createFormData(operation) {
        var formData = new FormData();
        formData.append('operation', operation);
        formData.append('applicationId', this.editedItem.applicationId);
        formData.append('organization_Id', this.organization._id);
        formData.append('source', this.editedItem.source);
        if (this.editedItem._id) {
          formData.append('_id', this.editedItem._id);
        }
        formData.append('logo', this.editedItem.logo);
        formData.append('logoUpdated', this.logoUpdated)
        formData.append('name', this.editedItem.name);
        formData.append('url', this.editedItem.url);
        formData.append('status', this.editedItem.status);
        if (!this.editedItem._id && this.editedItem.pages.length>0) {
          formData.append('pages', JSON.stringify(this.editedItem.pages));
        }
        return formData;
      },
      editItem (item) {
        if (!item && this.$refs.appForm) {
          this.$refs.appForm.resetValidation();
        }
        if (!this.organization.applications) this.organization.applications = [];
        this.editedIndex = item?this.organization.applications.findIndex((application) => {return application._id === item._id;}):-1;
        this.editedItem = Object.assign({},item || this.defaultApp);
        this.dialog = true;
        setTimeout(()=>{
          this.prepDragNDrop();
          }, 500);
      },

      deleteItem (item) {
        var vm = this;
        const index = this.organization.applications.findIndex((application) => {return item._id?application._id === item._id:application.name === item.name;})
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          if (item._id) {
            (async () => {
              var response = await Api().delete('/organizationapplication/'+this.organization._id+'/'+item._id);
              if (response.data.success) {
                EventBus.$emit('global success alert', `${item.name} deleted.`);
                vm.$emit('orgAppsChanged', response.data.apps);
              } else if (response.data.errMsg) {
                EventBus.$emit('global error alert', response.data.errMsg);
              }
            })();
          } else {
            var apps = [].concat(this.organization.applications);
            apps.splice(index, 1);
            vm.$emit('orgAppsChanged', apps );
          }
        }
      },
      close (ensureFilled) {
        if (confirm('Do you want to "Save" before exiting?')) {
          if (ensureFilled===true && (!this.editedItem.applicationId || !this.editedItem.name)) {
            var tempId = 'tempid-'+(new Date()).getTime();
            if (!this.editedItem.name) this.editedItem.name = tempId;
            if (!this.editedItem.applicationId) this.editedItem.applicationId = tempId;
          }
          this.$nextTick(()=>{this.save(()=>{this.dialog=false;});})
        } else {
          this.dialog = false;
          this.$emit("orgAppsChanged");
        }
      },
      save (cb) {
        var vm = this;
        if (!this.$refs.appForm.validate()) return;
        var operation = this.editedIndex > -1 ? 'update' : 'add';
        if (operation == 'update' || this.organization._id) {
          (async () => {

            var response = await MultipartPostApi().post('/organizationapplication/upsert', this.createFormData(operation));
            if (response.data.success) {
              EventBus.$emit('global success alert', `${this.editedItem.name} ${operation=='update'?'updated':'added'}.`);
              vm.$emit('orgAppsChanged', response.data.applications );
              this.dialog = false;
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            }
            if (cb) (cb)();
          })();
        } else {
          var apps = [].concat( this.organization.applications );
          apps.push(this.editedItem);
          vm.$emit('orgAppsChanged', response.data.applications );
          if (cb) (cb)();
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