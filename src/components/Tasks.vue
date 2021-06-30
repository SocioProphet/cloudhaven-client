<template>
  <div class="mt-3">
    <v-row>
      <v-toolbar dense elevation="5">
      <v-toolbar-title class="mr-3">Tasks</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon><v-icon>mdi-refresh</v-icon></v-btn>
      <!--v-form class="ma-0 pa-0"><v-text-field class="ma-0 pa-0" prepend-inner-icon="mdi-magnify" hide-details placeholder="Search" dense/></v-form-->
    </v-toolbar>
    </v-row>
    <v-row>
      <v-col cols="3"  nowrap>
        <v-treeview :items="taskFolders" elevation="2" dense activatable :active="active" @update:active="onActivated"></v-treeview>
      </v-col>
      <v-col cols="9" class="justify-start">
        <v-row>
        <v-divider class="ma-4" vertical ></v-divider>
          <v-data-table :headers="headers" :items="tasks" style="width:100%">
            <template v-slot:item="{ item }">
            <tr @click="viewTask(item)">
              <td >
                <v-row class="justify-center align-center align-stretch">
                <v-btn v-if="activeList==1" icon ><v-icon medium @click.stop="grabTask(item)">mdi-keyboard-return</v-icon></v-btn>
                <v-btn v-else-if="activeList==2" icon><v-icon medium @click.stop="grabTask(item)">mdi-hand</v-icon></v-btn>
                <v-btn icon ><v-icon medium @click.stop="viewTask(item)">mdi-eye-outline</v-icon></v-btn>
                </v-row>
              </td>
              <td style="width:35%">{{item.subject}}</td>
              <td v-if="activeList==2" style="width:30%">{{item.group.name}}</td>
              <td v-else style="width:30%">{{item.message.substring(0,20)+(item.message.length>20?'...':'')}}</td>
              <td style="width:20%">{{ item.date | datetime }}</td>
            </tr>
            </template>
          </v-data-table>
        </v-row>
      </v-col>
    </v-row>
      <v-dialog v-model="dialog" max-width="95%" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2" >
        <v-card >
          <v-card-title class="ma-0 py-1 px-2"><span class="text-h5">{{task.subject}}</span><v-spacer></v-spacer></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation >
              <v-textarea readonly :value="task.message" label="Description"></v-textarea>
              <OrganizationAppPane v-if="activeList!=2" :application="task.app" :page="page" :standAlone="true"></OrganizationAppPane>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Close</v-btn>
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
      taskFolders: [
        {id:1, name: 'My Tasks'},
        {id:2, name: 'Unassigned Tasks'},
        {id:3, name: 'Archived Tasks'}
      ],
      myTasksHeaders: [
        { text: 'Actions', sortable: false, align:'center' },
        { text: 'Subject', sortable: true, value:'subject' },
        { text: 'Message', sortable: true, value: 'message' },
        { text: 'Date', align:'left', sortable:true, value: 'date' }
      ],
      unassignedTasksHeaders: [
        { text: 'Actions', sortable: false, align:'center' },
        { text: 'Subject', sortable: true, value:'subject' },
        { text: 'Group', sortable: true, value: 'group.name' },
        { text: 'Date', align:'left', sortable:true, value: 'date' }
      ],
      task: {
        _id: null,
        subject: '',
        message: '',
        date: null,
        app:{_id:'', applicationId:"", name:'', url:'', organization:{_id:'', organizationId:'', name:''}}
      },
      myTasks: [],
      unassignedTasks: [],
      active: [1],
      uniqueKey:1,
      page:"home",
      editMode:'edit'
    }),
    computed: {
      activeList() {
        return this.active[0];
      },
      headers() {
        return this.activeList!=2?this.myTasksHeaders:this.unassignedTasksHeaders;
      },
      tasks() {
        if (this.activeList==1) {
          return this.myTasks.filter(t=>(!t.isDone));
        } else if (this.activeList==2) {
          return this.unassignedTasks;
        } else {
          return this.myTasks.filter(t=>(t.isDone));
        }
      },
      formTitle () {
        return `??`;
      },
      ...mapState(['user'])
    },

    watch: {
    },

    mounted () {
      this.getMyTasks();
      this.getUnassignedTasks();
      EventBus.$on('taskOutcomeSubmitted' ,()=>{
        this.task.isDone = true;
        this.getMyTasks();
        this.getUnassignedTasks();
        this.dialog = false;
        this.active[0] = 3;
      })
    },
    methods: {
      grabTask(task) {
        (async () => {
          var path = `/messagemgr/grabtask/${task._id}/${this.user._id}`;
          var response = await Api().get(path);
          if (response.data.success) {
            this.getMyTasks();
            this.getUnassignedTasks();
            this.active[0] = 1;
            EventBus.$emit('global success alert', `Task ${task.subject} grabbed.`);
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg);
          }
        })();
      },
      onActivated( activeItems ) {
        if (activeItems[0]==2) {
          this.getUnassignedTasks();
        } else {
          this.getMyTasks();
        }
        this.active = activeItems;
      },
      getMyTasks() {
        (async () => {
          var response = await Api().get('/messagemgr/gettasksforuser/'+this.user._id);
          if (response.data.success) {
            var myTasks = response.data.tasks.map(t=>(Object.assign(t,{date:moment(t.date).toDate()})));
            this.myTasks = myTasks;
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg);
          }
        })();
      },
      getUnassignedTasks() {
        (async () => {
          var response = await Api().get(`/messagemgr/getunassignedtasksforuser/${this.user._id}`);
          if (response.data.success) {
            var tasks = response.data.tasks.map(t=>(Object.assign(t, {date:moment(t.date).toDate()})));
            this.unassignedTasks = tasks;
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg);
          }
        })();
      },
      cancel() {
        this.dialog = false;
      },
      viewTask (item) {
        var task = Object.assign({}, item);
        if (task.app) {
          task.app.messageOrTask= item;
          task.app.appConfigData = item.appConfigData || {};
        }
        this.task = task;
        this.dialog = true;
      },

/*      deleteTask (item) {
        if (confirm('Are you sure you want to delete '+item.subject+'?')) {
          var folderId = this.active.length>0?this.active[0]:null;
          var msgId = item._id;
          var userId = this.user._id;
          (async () => {
            var response = await Api().delete(`/messagemgr/userdeletemsg/${userId}/${folderId}/${msgId}`);
            this.loadMessages();
          })();
        }
      },*/

      cancel() {
        this.dialog = false;
      },
      close () {
        setTimeout(() => {
          this.message = {_id:null, subject: '',  message:'', date: null}
        }, 300)
      },
      sendMsg () {
      }
    }
  }
</script>