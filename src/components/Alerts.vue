<template>
 <div>
  <v-card>
    <v-card-title>
      <span class="text-h5">Alerts</span>
    </v-card-title>

    <!--v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row class="justify-space-around flex-wrap">
          <v-col sm="12" md="5" lg="5">
            <v-text-field v-model="sStartDate" label="Start Date"  v-mask="'##/##/####'" @blur="updateSearch"></v-text-field>
          </v-col>
          <v-col sm="12" md="5" lg="5">
            <v-text-field v-model="sEndDate" label="End Date" v-mask="'##/##/####'"  @blur="updateSearch"></v-text-field>
          </v-col>
          <v-col sm="12" md="5" lg="5">
            <v-select v-model="type" label="Event/Error" :items="['Event', 'Error']" @change="updateSearch"></v-select>
          </v-col>
          <v-col sm="12" md="5" lg="5">
            <v-select v-model="category" label="Category" :items="['', 'Claim Submission', 'Claim Status', 'Daily Job', 'Email']" @change="updateSearch"></v-select>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text-->

    <v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click="cancelForm()"><v-icon left dark>mdi-arrow-left</v-icon>Go Back</v-btn>
      <v-spacer></v-spacer>
      <!--v-btn color="blue darken-1" text @click="updateSearch()">Search</v-btn-->
    </v-card-actions>

  </v-card>
    <v-data-table
      :headers="headers"
      :items="records"
      hide-default-footer disable-pagination
      class="elevation-1"
    >
      <template v-slot:item="{ item }">
       <tr>
        <td width="8%">{{ item.caseId }}</td>
        <td width="12%">{{ item.datetime | datetime }}</td>
        <td width="65%">{{ item.contents }}</td>
        <td width="15%">{{ item.author }}</td>
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
        { text: 'Case #', value: 'caseId', sortable: true, align:'left' },
        { text: 'Date/Time', value: 'datetime', sortable: true, align:'left' },
        { text: 'Content', value: 'contents', sortable: true, align:'left' },
        { text: 'Author', value: 'author', sortable: true, align:'left' },
      ],
/*      sStartDate: '',
      sEndDate: '',
      category: '',
      type: 'Event',*/
      records:[]
    }),

    computed: {
    },

    mounted () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      this.sEndDate = moment().startOf('day').add(1, 'days').format('MM/DD/YYYY');
      this.sStartDate = moment().startOf('day').format('MM/DD/YYYY');
      this.updateSearch();
    },
    methods: {
      updateSearch() {
        (async () => {
          var response = await Api().get('/alerts', {
/*            startDate:this.sStartDate.length==10?moment(this.sStartDate,'MM/DD/YYYY').toDate():'',
            endDate:this.sEndDate.length==10?moment(this.sEndDate,'MM/DD/YYYY').add(1, 'days').startOf('day').toDate():'',
            category:this.category,
            type:this.type*/
          });
          var alerts = [].concat(response.data)
          this.records = alerts.sort((a,b)=>(moment(a.datetime).isAfter(b.datetime)?-1:1));
        })();
      },
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>
