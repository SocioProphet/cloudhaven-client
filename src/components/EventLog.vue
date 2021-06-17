<template>
 <div>
  <v-card>
    <v-card-title>
      <span class="text-h5">Event/Error Log</span>
    </v-card-title>

    <v-card-text>
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
    </v-card-text>

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
        <td >{{ item.category }}</td>
        <td >{{ item.datetime | datetime }}</td>
        <td >{{ item.event }}</td>
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
        { text: 'Category', value: 'category', sortable: true, align:'left' },
        { text: 'Date/Time', value: 'datetime', sortable: true, align:'left' },
        { text: 'Event', value: 'isPHI', sortable: true, align:'left' }
      ],
      sStartDate: '',
      sEndDate: '',
      category: '',
      type: 'Event',
      records:[]
    }),

    computed: {
    },

    mounted () {
      this.sEndDate = moment().startOf('day').add(1, 'days').format('MM/DD/YYYY');
      this.sStartDate = moment().startOf('day').format('MM/DD/YYYY');
      this.updateSearch();
    },
    methods: {
      updateSearch() {
        (async () => {
          var response = await Api().post('/eventlog', {
            startDate:this.sStartDate.length==10?moment(this.sStartDate,'MM/DD/YYYY').toDate():'',
            endDate:this.sEndDate.length==10?moment(this.sEndDate,'MM/DD/YYYY').add(1, 'days').startOf('day').toDate():'',
            category:this.category,
            type:this.type
          });
          this.records = response.data.sort((a,b)=>(moment(a.datetime).isAfter(b.datetime)?-1:1));
        })();
      },
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>
