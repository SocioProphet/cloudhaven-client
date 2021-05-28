<template>
  <div>
    <v-sheet tile height="54" class="d-flex mb-0 pb-0" >
      <v-toolbar dense elevation="0" class="mb-0 pb-0">
      <v-toolbar-title class="mr-3">Calendar</v-toolbar-title>
      <v-btn icon><v-icon>mdi-calendar-refresh</v-icon></v-btn>
      <v-select style="max-width:85px" v-model="calendarMode" :items="calendarModes" dense hide-details class="ma-2" placeholder="type" ></v-select>
      <v-btn icon @click.stop="editMessage()"><v-icon>mdi-calendar-plus</v-icon></v-btn>
      <v-spacer></v-spacer>
      <v-spacer></v-spacer>
      <v-form class="ma-0 pa-0"><v-text-field class="ma-0 pa-0" prepend-inner-icon="mdi-magnify" hide-details placeholder="Search" dense/></v-form>
    </v-toolbar>
    </v-sheet>
    <v-sheet height="700" class="mt-0 pt-0">
      <v-calendar ref="calendar" v-model="calendarValue" :weekdays="weekday" :type="calendarMode"
        :events="events" event-overlap-mode="stack" :event-overlap-threshold="30" :event-color="getEventColor"
        @change="getEvents"
      ></v-calendar>
    </v-sheet>
      <v-dialog v-model="dialog" max-width="1000px" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2">
        <v-card>
          <v-card-title><span class="text-h5">Create Message</span></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
              <v-text-field v-model="event.title" label="Subject" :rules="[rules.required]"></v-text-field>
              <v-textarea v-model="event.content" label="Message"></v-textarea>
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
      calendarValue: '',
      valid: true,
      rules: {
          required: value => !!value || 'Required.'
      },
      event: {
        _id: null,
        title: '',
        content: '',
        date: null
      },
      searchText:'',
      events: [
        {title:'Test Event', correspondent:'Rich Vann', date: new Date() }
      ],
      curDate: new Date(),
      calendarMode: 'month',
      calendarModes: ['month', 'week', 'day', '4day'],
      weekday: [0, 1, 2, 3, 4, 5, 6],
      events: [],
      colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
      names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party']
    }),

    computed: {
      formTitle () {
        if (!this.event._id) {
          return 'Create Event';
        }
        return this.event.title;
      },
      ...mapState(['user'])
    },

    watch: {
    },

    created () {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      EventBus.$on('calendar data refresh', () =>{
        loadCalendar();
      })
      this.loadCalendar();
    },
    methods: {
      getEvents ({ start, end }) {
        const events = []

        const min = new Date(`${start.date}T00:00:00`)
        const max = new Date(`${end.date}T23:59:59`)
        const days = (max.getTime() - min.getTime()) / 86400000
        const eventCount = this.rnd(days, days + 20)

        for (let i = 0; i < eventCount; i++) {
          const allDay = this.rnd(0, 3) === 0
          const firstTimestamp = this.rnd(min.getTime(), max.getTime())
          const first = new Date(firstTimestamp - (firstTimestamp % 900000))
          const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000
          const second = new Date(first.getTime() + secondTimestamp)

          events.push({
            name: this.names[this.rnd(0, this.names.length - 1)],
            start: first,
            end: second,
            color: this.colors[this.rnd(0, this.colors.length - 1)],
            timed: !allDay,
          })
        }

        this.events = events
      },
      getEventColor (event) {
        return event.color
      },
      rnd (a, b) {
        return Math.floor((b - a + 1) * Math.random()) + a
      },
      loadCalendar() {
        (async () => {
          var response = await Api().post('/calendar/getmonth',{calendarMode: this.calendarMode, date: this.curDate});
        })();
      },
      cancel() {
        this.dialog = false;
      },
      editMessage (item) {
        this.dialog = true
      },

      deleteItem (item) {
        this.$store.commit('SET_RESULTNOTIFICATION', '')
        if (confirm('Are you sure you want to delete '+item.name+'?')) {
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