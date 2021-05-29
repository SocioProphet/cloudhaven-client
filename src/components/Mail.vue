<template>
  <div class="mt-3">
    <v-row>
      <v-toolbar dense elevation="5">
      <v-toolbar-title class="mr-3">Messages</v-toolbar-title>
      <v-btn icon><v-icon>mdi-email-sync-outline</v-icon></v-btn>
      <v-btn icon @click.stop="addMessage()"><v-icon>mdi-email-plus-outline</v-icon>
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
            <v-autocomplete v-model="to" :items="toOptions" :loading="toIsLoading" :search-input.sync="toSearch" color="white"
              hide-no-data hide-selected item-text="email" item-value="_id" label="To" dense
              placeholder="TO: type some letters of the email or name" return-object
            ></v-autocomplete>
            <v-autocomplete v-model="cc" :items="ccOptions" :loading="ccIsLoading" :search-input.sync="ccSearch" color="white"
              hide-no-data hide-selected item-text="email" item-value="_id" label="CC" dense
              placeholder="CC: type some letters of the email or name" return-object
            ></v-autocomplete>
            <v-autocomplete v-model="bcc" :items="bccOptions" :loading="bccIsLoading" :search-input.sync="bccSearch" color="white"
              hide-no-data hide-selected item-text="email" item-value="_id" label="BCC" dense
              placeholder="BCC: type some letters of the email or name" return-object
            ></v-autocomplete>
              <v-text-field v-model="message.subject" label="Subject" :rules="[rules.required]"></v-text-field>
              <v-textarea v-model="message.message" label="Message"></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="sendMsg"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
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
      active: [],
      to:null,
      toSearch:'',
      toSearchTimeoutId:null,
      toOptions:[],
      toIsLoading:false,
      toDests:[],
      cc:null,
      ccSearch:'',
      ccSearchTimeoutId:null,
      ccOptions:[],
      ccIsLoading:false,
      ccDests:[],
      bcc:null,
      bccSearch:'',
      bccSearchTimeoutId:null,
      bccOptions:[],
      bccIsLoading:false,
      bccDests:[]
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
      toSearch( value ) {
        if (this.toSearchTimeoutId) {
          clearTimeout(this.toSearchTimeoutId);
        }
        this.toIsLoading = true;
        this.toSearchTimeoutId = setTimeout(() => {
          this.loadUserOptions( 'toOptions', value, () => {this.toIsLoading = false;});
        }, 600);
      },
      ccSearch( value ) {
        if (this.ccSearchTimeoutId) {
          clearTimeout(this.ccSearchTimeoutId);
        }
        this.ccIsLoading = true;
        this.ccSearchTimeoutId = setTimeout(() => {
          this.loadUserOptions('ccOptions', value, () => {this.ccIsLoading = false;});
        }, 600);
      },
      bccSearch( value ) {
        if (this.bccSearchTimeoutId) {
          clearTimeout(this.bccSearchTimeoutId);
        }
        this.bccIsLoading = true;
        this.bccSearchTimeoutId = setTimeout(() => {
          this.loadUserOptions('bccOptions', value, () => {this.bccIsLoading = false;} );
        }, 600);
      },
      active( actives ) {
        debugger;
        this.loadMessages( actives.length>0?actives[0]:null);
      }
    },

    mounted () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.toOptions = [];
      this.ccOptions = [];
      this.bccOptions = [];
      EventBus.$on('messages data refresh', () =>{
        loadFolderTree();
      })
      this.loadFolderTree();
    },
    methods: {
      loadUserOptions( options, searchPhrase, cb ) {
        if (!searchPhrase) {
          options = [];
          return;
        }
        var vm = this;
        (async () => {
          try {
            var response = await Api().post('/usersearch/emailnamesearch', {searchPhrase:searchPhrase});

            vm[options] = (response.data || []).sort((a,b) => {
              return a.email<b.email?-1:(a.email>b.email?1:0);
            });
          } finally {
//            if (cb) (cb)();
          }
        })();

      },
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
              this.folderMap[f._id] = f;
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
      loadMessages( folderId ) {
        if (!folderId) {
          this.messages = [];
          return;
        }
        var fMap = this.folderMap;
        var folderName = fMap[folderId].name;
        debugger;
        (async () => {
          var response = await Api().get('/messagemgr/getfoldermsgs/'+folderId+'/'+(folderName=='Sent'?'true':'false'));
          var messages = (response.data || []);
          messages.sort((a,b)=>(a.date<b.date?-1:(a.date>b.date?1:0)));
          messages = messages.map((m)=>{
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
      addMessage (item) {
        this.message = Object.assign({}, item);
        this.dialog = true;
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
      sendMsg () {
        if (!this.$refs.theForm.validate()) return;
        (async () => {
            var response = await Api().post('/messagemgr/usersendmsg', 
            {sender: this.user._id, recipients:[{type:'to', email:this.to.email}], subject: this.message.subject, message: this.message.message});
            alert(JSON.stringify(response));
//req.body.sender, req.body.recipients, "Inbox",  req.body.subject, req.body.message
          this.dialog = false;
        })();
      }
    }
  }
</script>