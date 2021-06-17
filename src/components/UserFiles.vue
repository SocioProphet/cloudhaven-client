<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>User Files</v-toolbar-title>
      <v-divider class="mx-3" inset vertical></v-divider>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" max-width="1000px" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2" >
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" color="primary" dark class="mb-3">New User File</v-btn>
        </template>
        <v-card>
          <v-card-title><span class="text-h5">{{ formTitle }}</span></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
            <v-text-field v-model="editedItem.name" label="Name" ></v-text-field>
            <v-text-field v-model="editedItem.fileName" label="Filename" required :rules="[rules.required]" ></v-text-field>
            <v-text-field :value="editedItem.mimeType" readonly label="Mime Type" ></v-text-field>
            <v-file-input v-model="editedItem.file" accept="*/*" label="File input" @change="onFileChange"></v-file-input>
            <CHFileViewer v-if="editedItem.mimeType" :mimeType="editedItem.mimeType" label="File" :filename="this.editedItem.fileName" :dataString="dataString" :key="updateKey" :dataBlob="dataBlob"></CHFileViewer>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>
    <v-data-table
      :headers="headers"
      :items="userFiles"
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
        <td class="pt-3">{{ item.name }}</td>
        <td class="pt-3">{{ item.fileName }}</td>
        <td class="pt-3">{{ item.mimeType | mimeType }}</td>
       </tr>
      </template>
    </v-data-table>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
import MultipartPostApi from '@/services/MultipartPostApi'
import CHFileViewer from './CHFileViewer.vue'
  export default {
    components:{CHFileViewer},
    data: () => ({
      dialog: false,
      valid: true,
      rules: {
          required: value => !!value || 'Required.'
      },
      headers: [
        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Name', align: 'left', sortable: true, value: 'name' },
        { text: 'Filename', align:'left', sortable:true, value: 'fileName' },
        { text: 'Mime Type', align:'left', sortable:true, value: 'mimeType' }
      ],
      editedIndex: -1,
      editedItem: {
        name: '',
        fileName: '',
        mimeType: '',
        file:null
      },
      userFiles: [],
      origDataString: '',
      dataString:'',
      origDataBlob: null,
      dataBlob:null,
      updateKey: 1
    }),

    computed: {
      formTitle () {
        return this.editedIndex === -1 ? 'New User File' : 'Edit User File'
      },
      ...mapState(['user'])
    },

    watch: {
      dialog (val) {
        if (!val) {
          this.close()
        }
      }
    },

    created () {
      EventBus.$on('users files data refresh', () =>{
      })
      this.loadUserFiles();
    },

    methods: {
      cancel() {
        this.dataString = this.origDataString;
        this.dataBlob = this.origDataBlob;
        this.dialog = false;
      },
      onFileChange( file ) {
        if (!file) {
          this.editedItem.fileName = '';
          this.editedItem.mimeType = '';
          return;
        }
        this.editedItem.fileName = file.name;
        this.editedItem.mimeType = file.type;
        if (!this.editedItem.name) {
          var pos = this.editedItem.fileName.lastIndexOf('.');
          this.editedItem.name = pos>0?this.editedItem.fileName.substring(0,pos):this.editedItem.fileName;
        }
        var oThis = this;
        if (file.type == 'text/plain') {
          var reader = new FileReader();
          reader.onload = (e)=>{
            oThis.dataString =  e.target.result;
          };
          reader.readAsText(file);
        } else if (file.type == 'application/pdf' || file.type.indexOf('image/')==0) {
          this.dataBlob = file;
//          this.dataBlob = new Blob([file],{type: 'application/pdf'});
        } else if (file.type=='application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//          this.dataString = 'Preview not available - save and reload to view.';
          (async () => {
            var formData = new FormData();
            formData.append('files.'+file.name, file);
            var response = await MultipartPostApi().post('/userdata/userfile/doc2html', formData);
            this.dataString = response.data;
          })();
        }
        oThis.updateKey++; //repaint the file viewer
      },
      loadUserFiles() {
        var u = this.user;
        (async () => {
          var response = await Api().get('/userdata/userfile/list/'+this.user._id);
          this.userFiles = response.data || {};
        })();
      },
      editItem (item) {
        this.origDataString = this.dataString;
        this.origDataBlob = this.dataBlob;
        this.editedIndex = this.userFiles.indexOf(item);
        this.editedItem = Object.assign({}, item);
        var oThis = this;
        if (!this.editedItem._id) {
          this.$refs.form.reset()
        }
          (async () => {
            var response = await Api().get(`/userdata/userfile/getfile/${this.user._id}/${item._id}`,
                              {responseType: 'blob', timeout: 30000 });
            var parts = response.headers["content-disposition"].split(/["']/);
            const rawFilename = parts[1];
            var parts = rawFilename.split('-_-_-');
            const contentType = response.headers["content-type"];
            if (contentType == 'text/plain' || contentType=='application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              response.data.text()
              .then(s=>{
                this.dataString = s;
              })
            } else if (item.mimeType == 'application/pdf'  || item.mimeType.indexOf('image/')==0) {
              this.dataBlob = new File( [response.data], item.fileName, {type: item.mimeType});
              oThis.updateKey++;
            }
            this.dialog = true
          })();
      },

      deleteItem (item) {
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
          (async () => {
            var formData = new FormData();
            formData.append('userId',  this.user._id);
            formData.append('op', 'delete');
            formData.append('fileId', item._id);
            var response = await Api().post('/userdata/userfile', formData);
            if (this.$safeRef(response.data).success) {
              this.loadUserFiles();
              EventBus.$emit('global success alert', `${item.name} deleted.`);
            }
          })();
        }
      },

      cancel() {
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.editedItem = {name: '', fileName: '', mimeType:'', file:null }
          this.editedIndex = -1
        }, 300)
      },
      save () {
        if (!this.$refs.theForm.validate()) return;
        (async () => {
          var formData = new FormData();
          formData.append('userId',  this.user._id);
          formData.append('op', (this.editedIndex > -1)?'update':'add');
          formData.append('name', this.editedItem.name);
          formData.append('fileName', this.editedItem.fileName);
          formData.append('mimeType', this.editedItem.mimeType);
          if (this.editedItem._id) {
            formData.append('fileId', this.editedItem._id);
          }
          if (this.editedItem.file) {
            formData.append('files.'+this.editedItem.fileName, this.editedItem.file);
          }
          var response = await MultipartPostApi().post('/userdata/userfile', formData);
          if (this.$safeRef(response.data).success) {
            this.loadUserFiles();
            EventBus.$emit('global success alert', `${this.editedItem.name} ${this.editedIndex > -1?'updated':'added'}.`);
          }
          this.dialog = false;
        })();
      }
    }
  }
</script>