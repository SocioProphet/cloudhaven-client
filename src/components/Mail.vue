<template>
  <div class="mt-3">
    <v-row>
      <v-toolbar dense elevation="5">
      <v-toolbar-title class="mr-3">Messages</v-toolbar-title>
      <v-btn icon><v-icon>mdi-email-sync-outline</v-icon></v-btn>
      <v-btn icon @click.stop="editMessage()"><v-icon>mdi-email-plus-outline</v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-form class="ma-0 pa-0"><v-text-field class="ma-0 pa-0" prepend-inner-icon="mdi-magnify" hide-details placeholder="Search" dense/></v-form>
    </v-toolbar>
    </v-row>
    <v-row>
      <v-col cols="3"  nowrap>
        <v-treeview :items="folderTree" elevation="2" dense activatable :active="active" @update:active="onActivated"></v-treeview>
      </v-col>
      <v-col cols="9" class="justify-start">
        <v-row>
        <v-divider class="ma-4" vertical ></v-divider>
    <v-data-table :headers="headers" :items="messages" style="width:100%">
      <template v-slot:[`header.selector`]="{header}">
        <v-simple-checkbox dense hide-details />
      </template>
      <template v-slot:item="{ item }">
       <tr @click="viewMessage(item)">
         <td style="width:5%" class="align-center"><v-simple-checkbox dense hide-details /></td>
        <td style="width:10%">
          <v-row class="justify-center align-center align-stretch">
          <v-btn icon ><v-icon medium @click.stop="viewMessage(item)">mdi-email-open-outline</v-icon></v-btn>
          <v-btn icon >
          <v-icon
            medium
            @click.stop="deleteMessage(item)"
          >
            mdi-trash-can
          </v-icon>
          </v-btn>
          </v-row>
        </td>
        <td style="width:35%">{{item.subject}}</td>
        <td style="width:30%">{{item.correspondent}}</td>
        <td style="width:20%">{{ item.date | datetime }}</td>
       </tr>
      </template>
    </v-data-table>
        </v-row>
      </v-col>
    </v-row>
      <v-dialog v-model="dialog" max-width="1000px" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2">
        <v-card>
          <v-card-title><span class="text-h5">Create Message</span></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
              <v-text-field v-model="message.subject" label="Subject" :rules="[rules.required]"></v-text-field>
              <v-textarea v-model="message.message" label="Message"></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
import MultipartPostApi from '@/services/MultipartPostApi'
import CHFileViewer from './CHFileViewer.vue'
import moment from 'moment';

  export default {
    components:{CHFileViewer},
    data: () => ({
      dialog: false,
      valid: true,
      rules: {
          required: value => !!value || 'Required.'
      },
      headers: [
        { value: 'selector', sortable:false },
        { text: 'Actions', sortable: false, align:'center' },
        { text: 'Subject', sortable: true, value:'subject' },
        { text: 'Correspondent', sortable: true, value: 'correspondent' },
        { text: 'Date', align:'left', sortable:true, value: 'date' }
      ],
      message: {
        _id: null,
        subject: '',
        message: '',
        date: null
      },
      folderTree:[],
      searchText:'',
      currentFolder: null,
      messages: [],
      folderMap: {},
      active: []
    }),

    computed: {
      activeFolderId() {
        return this.active.length>0?this.active[0]:null;
      },
      activeFolder() {
        return this.activeFolderId?this.folderMap[this.activeFolderId]:{};
      },
      activeFolderName() {
        return this.activeFolder?this.activeFolder.name:'';
      },
      formTitle () {
        if (!this.message._id) {
          return 'Create Message';
        }
        var datePrefix = this.activeFolderName == 'Sent'?'Sent ':' Received ';
        return `${this.activeFolderName} ${datePrefix} ${moment(this.message.date).format('l LT')}`;
      },
      ...mapState(['user'])
    },

    watch: {
      active() {
        this.loadMessages();
      }
    },

    created () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      EventBus.$on('messages data refresh', () =>{
        loadFolderTree();
      })
      this.loadFolderTree();
    },
    methods: {
      onActivated( activeItems ) {
        this.active = activeItems;
      },
      getChildren( curFolder, folders ) {
        curFolder.children = folders.reduce((ar,f)=>{
          if (f.parentFolder == curFolder.id) {
            var fObj = {id:f._id, name: f.name, children:[], folder:f};
            this.folderMap[f._id] = f;
            this.getChildren( fObj, folders);
            ar.push( fObj );
          }
          return ar;
        },[]);
      },
      loadFolderTree() {
        (async () => {
          var response = await Api().get('/messagemgr/gettree');
          var folders = (response.data || []);
          this.folderTree = folders.reduce((ar, f)=>{
            if (!f.parentFolder) {
              ar.push({id:f._id, name: f.name, children:[], folder:f});
            }
            return ar;
          },[]);
          this.active.push(this.folderTree[0].id);
          this.loadMessages();
          this.folderTree.forEach(f=>{
            this.getChildren( f, folders );
          })
        })();
      },
      loadMessages() {
        (async () => {
          var response = await Api().get('/messagemgr/getfoldermsgs/'+this.activeFolderId+'/'+(this.activeFolderName=='Sent'?'true':'false'));
          var messages = (response.data || []);
          messages.sort((a,b)=>(a.date<b.date?-1:(a.date>b.date?1:0)));
          messages = messages.map((m)=>{
            debugger;
            var sharing = m.sharings.find(s=>(s.recipientType=='to'));
            var correspondent = sharing.user.name;
            return {subject: m.subject, date: m.date, correspondent: correspondent, message:m.message}
          })
          this.messages = messages;
        })();
      },
      cancel() {
        this.dialog = false;
      },
      viewMessage (item) {
        this.message = Object.assign({}, item);
        this.dialog = true;
      },

      deleteMessage (item) {
        this.$store.commit('SET_RESULTNOTIFICATION', '')
        if (confirm('Are you sure you want to delete '+item.subject+'?')) {
          (async () => {
/*            var formData = new FormData();
            formData.append('userId',  this.user._id);
            formData.append('op', 'delete');
            formData.append('fileId', item._id);
            var response = await Api().post('/userdata/userfile', formData);
            if (this.$safeRef(response.data).success) {
              this.loadUserFiles();
              this.$store.commit('SET_SUCCESS', `${item.name} deleted.`);
            }*/
          })();
        }
      },

      cancel() {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.message = {_id:null, subject: '',  message:'', date: null}
        }, 300)
      },
      save () {
        if (!this.$refs.theForm.validate()) return;
        (async () => {
          this.dialog = false;
        })();
      }
    }
  }
</script>