<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>View {{user.name}}'s Data</v-toolbar-title>
    </v-toolbar>
    <v-expansion-panels accordion v-model="panel" hover multiple>
      <v-expansion-panel >
        <v-expansion-panel-header>Discrete Data</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            :headers="headers"
            :items="userDataList"
            hide-default-footer disable-pagination
            class="elevation-1"
          >
            <template v-slot:item="{ item }">
            <tr> <!--  @click="editItem(item)" -->
              <!--td>
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
              </td-->
              <td class="pt-3">{{ item.name }}</td>
              <td class="pt-3">{{ item.content }}</td>
            </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel >
        <v-expansion-panel-header>Bulk Data</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            :headers="bulkHeaders"
            :items="bulkList"
            hide-default-footer disable-pagination
            class="elevation-1"
          >
            <template v-slot:item="{ item }">
            <tr> <!--  @click="editItem(item)" -->
              <!--td>
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
              </td-->
              <td class="pt-3">{{ item.content }}</td>
              <td class="pt-3">{{ item.created_at | datetime}}</td>
            </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel >
        <v-expansion-panel-header>Conversations</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            :headers="conversationHeaders"
            :items="comments"
            hide-default-footer disable-pagination
            class="elevation-1"
          >
            <template v-slot:item="{ item }">
            <tr> <!--  @click="editItem(item)" -->
              <!--td>
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
              </td-->
              <td class="pt-3">{{ item.organization.name }}</td>
              <td class="pt-3">{{ item.applicationId }}</td>
              <td class="pt-3">{{ item.page }}</td>
              <td class="pt-3">{{ item.topic }}</td>
              <td class="pt-3">{{ item.comment }}</td>
              <td class="pt-3">{{ item.created_at | datetime}}</td>
            </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
import moment from 'moment';
  export default {
    data: () => ({
      panel: [0],
      headers: [
//        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Data Id', sortable: true, align:'left', value: 'name' },
        { text: 'Value', align: 'left', sortable: true, value: 'content' }
      ],
      userDataList: [],
      bulkHeaders: [
//        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Value', align: 'left', sortable: true, value: 'content' },
        { text: 'Create Datetime', sortable: true, align:'left', value: 'created_at' },
      ],
      conversationHeaders: [
        { text: 'Organization', align: 'left', sortable: true, value: 'organization.name' },
        { text: 'Application', align: 'left', sortable: true, value: 'applicationId' },
        { text: 'Page', align: 'left', sortable: true, value: 'page' },
        { text: 'Topic', align: 'left', sortable: true, value: 'topic' },
        { text: 'Comment', align: 'left', sortable: true, value: 'comment' },
        { text: 'Create Datetime', sortable: true, align:'left', value: 'created_at' }
      ],
      bulkList: [],
      comments: []
    }),

    computed: {
      ...mapState(['user'])
    },
    filters: {
      datetime: (value) => {
        return value?moment(value).format('l LT'):'';
      }
    },
    created () {
      this.loadUserData();
      EventBus.$on('user data refresh', () =>{
        this.loadUserData();
      })
    },

    methods: {
      loadUserData() {
        (async () => {
          var response = await Api().post('/userdata/batchget', {userIds: [this.user._id]});
          var userDataMap = response.data.userDataMap || {};
          this.userDataList = userDataMap[this.user._id] || [];
          response = await Api().get('/userdata/getbulkdata/'+this.user._id);
          this.bulkList = response.data;
          response = await Api().get('/conversation/list');
          if (response.data) {
            var comments = response.data.reduce((ar, cnv)=>{
              var rec = {organization:cnv.organization, applicationId: cnv.applicationId, page: cnv.page, topic:cnv.topic}
              cnv.comments.forEach(c=>{
                var row = Object.assign({}, rec);
                row.comment = c.content;
                row.created_at = c.created_at;
                ar.push(row);
              },[])
              return ar;
            },[]);
            this.comments = comments;
          } else {
            this.comments = {comments:[]};
          }

        })();
      }
    }
  }
</script>