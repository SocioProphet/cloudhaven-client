<template>
 <div>
  <v-card>
    <v-card-title>
      <span class="text-h5">Audit Log</span>
    </v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row class="justify-space-around flex-wrap">
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-text-field v-model="sStartDate" label="Start Date" v-mask="'##/##/####'" ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-text-field v-model="sEndDate" label="End Date" v-mask="'##/##/####'"  ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-select v-model="operation" label="Operation" :items="['','create', 'read', 'update', 'delete']" ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-select multiple v-model="model" label="Table" :items="modelOptions" ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-select multiple v-model="user" label="User" :items="userOptions" ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" xl="1">
            <v-text-field v-model="publicId" label="Public Id" ></v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click="cancelForm()"><v-icon left dark>mdi-arrow-left</v-icon>Go Back</v-btn>
      <v-spacer></v-spacer>
      <download-csv :data = "records" >
        <v-btn elevation="2" rounded color="blue darken-1" ><v-icon dark>mdi-cloud-download</v-icon>Download</v-btn>
      </download-csv>
      <v-spacer></v-spacer>
      <v-btn elevation="2" color="blue darken-1" text @click="updateSearch()">Search</v-btn>
    </v-card-actions>

  </v-card>
    <v-data-table
      :headers="headers"
      :items="records"
      hide-default-footer
      disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
       <tr @click="editItem(item)">
        <td>{{ $safeRef(item.user).name }}</td>
        <td>{{ item.operation }}</td>
        <td>{{ item.datetime | datetime }}</td>
        <td>{{ item.isPHI?'YES':'NO' }}</td>
        <td>{{ item.model }}</td>
        <td>{{ item.publicId }}</td>
        <td>{{ item.recordId }}</td>
       </tr>
      </template>
    </v-data-table>
 </div>
</template>

<script>
import Api from '@/services/Api'
import router from '../router'
import moment from 'moment'
  export default {
    data: () => ({
      valid: true,
      headers: [
        { text: 'User', value: 'user.name', sortable: true, align:'left' },
        { text: 'Operation', value: 'operation', sortable: true, align:'left' },
        { text: 'Date/Time', value: 'datetime', sortable: true, align:'left' },
        { text: 'PHI', value: 'isPHI', sortable: true, align:'left' },
        { text: 'Table', value: 'model', sortable: true, align:'left' },
        { text: 'Public Id', value: 'publicId', sortable: true, align:'left' },
        { text: 'Record Id', value: 'recordId', sortable: true, align:'left' }
      ],
      sStartDate: '',
      sEndDate: '',
      operation: '',
      model: '',
      user: {_id:'', name:''},
      publicId: '',
      modelOptions:['Organization', 'Setup'],
      userOptions:[],
      records:[]
    }),

    computed: {
    },

    mounted () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
        this.sEndDate = moment().startOf('day').format('MM/DD/YYYY');
        this.sStartDate = moment().subtract(1, 'months').startOf('day').format('MM/DD/YYYY');
    },
    methods: {
      updateSearch() {
        var s = this.sStartDate;
        (async () => {
          var response = await Api().post('/auditlog', {
            startDate:this.sStartDate.length==10?moment(this.sStartDate,'MM/DD/YYYY').toDate():'',
            endDate:this.sEndDate.length==10?moment(this.sEndDate,'MM/DD/YYYY').add(1, 'days').startOf('day').toDate():'',
            operation:this.operation,
            model:this.model,
            userId:this.$safeRef(this.user)._id,
            publicId:this.publicId
          });
          this.records = Array.isArray(response.data)?response.data:[];
        })();
      },
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>
