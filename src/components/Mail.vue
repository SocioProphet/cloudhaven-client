<template>
  <div class="mt-3">
    <v-row>
      <v-toolbar dense elevation="5">
      <v-toolbar-title class="mr-3">Messages</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon><v-icon>mdi-email-sync-outline</v-icon></v-btn>
      <v-btn icon @click.stop="addMessage()" class="mr-2"><v-icon>mdi-email-plus-outline</v-icon></v-btn>
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
      <v-dialog v-model="dialog" max-width="95%" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2" >
        <v-card style="margin-top:15vh">
          <v-card-title class="ma-0 py-1 px-2"><span class="text-h5">{{editMode=='edit'?'Create':'View'}} Message</span><v-spacer></v-spacer>
            <v-checkbox v-model="showCC" @input="showCC=!showCC" label="CC" class="ma-0 pa-1"></v-checkbox>
            <v-checkbox v-model="showBCC" @input="showBCC=!showBCC" label="BCC" class="ml-3 my-0 pa-1"></v-checkbox></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation >
                <v-autocomplete :readonly="editMode=='view'" v-model="to" :items="toOptions" :loading="toIsLoading" :search-input.sync="toSearch"
                  hide-no-data placeholder="type some letters of the email or name" dense label="To" hide-details
                  item-text="email" item-value="_id" return-object @change="toSelected" width="250px"
                ></v-autocomplete>
                <v-chip-group show-arrows>
                <v-chip v-for="user in toDests" :key="user.key" style="display:inline-block" class="ma-0" close @click:close="toDelete(user.key)">{{user.email}}</v-chip>
                </v-chip-group>
                <v-autocomplete v-if="editMode=='view' && showCC" class="mt-3" v-model="cc" :items="ccOptions" :loading="ccIsLoading" :search-input.sync="ccSearch"
                  hide-no-data placeholder="type some letters of the email or name" dense label="CC" hide-details
                  item-text="email" item-value="_id" return-object @change="ccSelected" width="250px"
                ></v-autocomplete>
                <v-chip-group  v-if="showCC" show-arrows>
                  <v-chip v-for="user in ccDests" :key="user.key" class="ma-0" close @click:close="ccDelete(user.key)">{{user.email}}</v-chip>
                </v-chip-group>
                <v-autocomplete v-if="editMode=='view' && showBCC" class="mt-3" v-model="bcc" :items="bccOptions" :loading="bccIsLoading" :search-input.sync="bccSearch"
                  hide-no-data placeholder="type some letters of the email or name" dense label="BCC" hide-details
                  item-text="email" item-value="_id" return-object @change="bccSelected" width="250px"
                ></v-autocomplete>
                <v-chip-group  v-if="showBCC" show-arrows>
                  <v-chip v-for="user in bccDests" :key="user.key" class="ma-0" close @click:close="bccDelete(user.key)">{{user.email}}</v-chip>
                </v-chip-group>
              <v-text-field v-model="message.subject" label="Subject" :rules="[rules.required]"></v-text-field>
              <v-textarea v-model="message.message" label="Message"></v-textarea>
              <OrganizationAppPane v-if="editMode=='view'" :application="app" :page="page"></OrganizationAppPane>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn v-if="editMode=='edit'" elevation="2" color="blue darken-1" text @click.native="sendMsg"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
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
import OrganizationAppPane from './OrganizationAppPane.vue'
import moment from 'moment';

  export default {
    components:{CHFileViewer, OrganizationAppPane},
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
      showCC: false,
      cc:null,
      ccSearch:'',
      ccSearchTimeoutId:null,
      ccOptions:[],
      ccIsLoading:false,
      ccDests:[],
      showBCC: false,
      bcc:null,
      bccSearch:'',
      bccSearchTimeoutId:null,
      bccOptions:[],
      bccIsLoading:false,
      bccDests:[],
      uniqueKey:1,
      app:{applicationId:"test-app", organizationId:"603ee28599a16849b4870d5b", name:'Test App', url:'http://localhost:3300/api/sandboxapp'},
      page:"home",
      editMode:'edit'
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
        this.genericLoadUserOptions( 'to', value );
      },
      ccSearch( value ) {
        this.genericLoadUserOptions( 'cc', value );
      },
      bccSearch( value ) {
        this.genericLoadUserOptions( 'bcc', value );
      },
      active( actives ) {
        this.loadMessages( actives.length>0?actives[0]:null);
      }
    },

    mounted () {
      this.toOptions = [];
      this.ccOptions = [];
      this.bccOptions = [];
      EventBus.$on('messages data refresh', () =>{
        loadFolderTree();
      })
      this.loadFolderTree();
    },
    methods: {
      toDelete( key ) {
        this.toDests = this.toDests.filter(td=>(td.key!=key));
      },
      ccDelete( key ) {
        this.ccDests = this.ccDests.filter(td=>(td.key!=key));
      },
      bccDelete( key ) {
        this.bccDests = this.bccDests.filter(td=>(td.key!=key));
      },
      toSelected( user ) {
        this.onDestSelected( user, 'to');
      },
      ccSelected( user ) {
        this.onDestSelected( user, 'cc');
      },
      bccSelected( user ) {
        this.onDestSelected( user, 'bcc');
      },
      onDestSelected( user, type ) {
        if (user) {
          user.key = this.uniqueKey++;
          this[type+'Dests'].push(user);
        }
        this[type+'Search'] = '';
      },
      genericLoadUserOptions( prefix, value ) {
        if (this[prefix+'SearchTimeoutId']) {
          clearTimeout(this[prefix+'SearchTimeoutId']);
        }
        this[prefix+'IsLoading'] = value?true:false;
        if (!value) {
          this[prefix+'Options'] = [];
          return;
        }
        this[prefix+'SearchTimeoutId'] = setTimeout(() => {
          this.loadUserOptions( prefix+'Options', value, () => {this[prefix+'IsLoading'] = false;});
        }, 500);
      },
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
          folderId = this.active.length>0?this.active[0]:null;
        }
        if (!folderId) {
          this.messages = [];
          return;
        }
        var fMap = this.folderMap;
        var folderName = fMap[folderId].name;
        (async () => {
          var response = await Api().get('/messagemgr/getfoldermsgs/'+folderId);
          var messages = (response.data || []);
          messages.sort((a,b)=>(a.date<b.date?-1:(a.date>b.date?1:0)));
          messages = messages.map((m)=>{
            var sharing = m.sharings.find(s=>(s.recipientType=='to'));
            var correspondent = sharing.user.name;
            return {_id:m._id, subject: m.subject, date: m.date, correspondent: correspondent, message:m.message}
          })
          this.messages = messages;
        })();
      },
      cancel() {
        this.dialog = false;
      },
      addMessage (item) {
        this.editMode = 'edit';
        this.message = Object.assign({}, item);
        this.dialog = true;
      },
      viewMessage (item) {
        this.editMode = 'view';
        this.message = Object.assign({}, item);
        this.dialog = true;
      },

      deleteMessage (item) {
        if (confirm('Are you sure you want to delete '+item.subject+'?')) {
          var folderId = this.active.length>0?this.active[0]:null;
          var msgId = item._id;
          var userId = this.user._id;
          (async () => {
            var response = await Api().delete(`/messagemgr/userdeletemsg/${userId}/${folderId}/${msgId}`);
            this.loadMessages();
          })();
        }
      },

      cancel() {
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
          var recipients = ['to', 'cc', 'bcc'].reduce((ar,type)=>{
            var emailMap = {};
            this[type+'Dests'].forEach(d=>{
              if (!emailMap[d.email]) {
                ar.push({type:type, email:d.email})
              }
              emailMap[d.email] = true;
            })
            return ar;
          },[]);
          var response = await Api().post('/messagemgr/send', 
            {sender: this.user._id, recipients:recipients, subject: this.message.subject, message: this.message.message});
          this.dialog = false;
          if (response.data.success) {
            EventBus.$emit('global success alert', this.message.subject+' sent.');
          }
          this.loadMessages();
        })();
      }
    }
  }
</script>