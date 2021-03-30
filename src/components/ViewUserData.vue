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
              <td class="pt-3">{{ item.created_at }}</td>
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
      bulkList: []
    }),

    computed: {
      ...mapState(['user'])
    },

    created () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.loadUserData();
      EventBus.$on('user data refresh', () =>{
        this.loadUserData();
      })
    },

    methods: {
      loadUserData() {
        (async () => {
          var response = await Api().post('/userdata/batchget', {userIds: [this.user._id]});
          debugger;
          var userDataMap = response.data || {};
          this.userDataList = userDataMap[this.user._id] || [];
        })();
        (async () => {
          var response = await Api().get('/userdata/getbulkdata/'+this.user._id);
          this.bulkList = response.data;
        })();
      }
    }
  }
</script>