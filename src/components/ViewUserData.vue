<template>
  <div>
    <v-container>
    <v-toolbar flat color="white">
      <v-toolbar-title>View {{user.name}}'s Data</v-toolbar-title>
    </v-toolbar>
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
    </v-container>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { EventBus } from '../event-bus.js';
import Api from '@/services/Api'
  export default {
    data: () => ({
      headers: [
//        { text: 'Actions', value: 'name', sortable: false, align:'center' },
        { text: 'Data Id', sortable: true, align:'left', value: 'name' },
        { text: 'Value', align: 'left', sortable: true, value: 'content' }
      ],
      userDataList: []
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
          var response = await Api().post('/userdata/batchget', {userId: this.user._id});
          this.userDataList = response.data;
        })();
      }
    }
  }
</script>