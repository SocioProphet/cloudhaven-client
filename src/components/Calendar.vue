<template>
  <div>
    <v-sheet tile height="54" class="d-flex mb-0 pb-0" >
      <v-toolbar dense elevation="0" class="mb-0 pb-0">
      <v-toolbar-title class="mr-3">{{$safeRef($refs.calendar).title}}</v-toolbar-title>
      <v-btn icon><v-icon>mdi-calendar-refresh</v-icon></v-btn>
      <v-select style="max-width:85px" v-model="calendarMode" :items="calendarModes" dense hide-details class="ma-2" placeholder="type" ></v-select>
      <v-btn icon @click.stop="addEvent()"><v-icon>mdi-calendar-plus</v-icon></v-btn>
      <v-spacer></v-spacer>
      <v-spacer></v-spacer>
      <v-form class="ma-0 pa-0"><v-text-field class="ma-0 pa-0" prepend-inner-icon="mdi-magnify" hide-details placeholder="Search" dense/></v-form>
    </v-toolbar>
    </v-sheet>
    <v-sheet height="700" class="mt-0 pt-0">
      <v-calendar ref="calendar" v-model="calendarValue" :weekdays="weekday" :type="calendarMode"
        :events="events" event-overlap-mode="stack" :event-overlap-threshold="30" :event-color="getEventColor"
        @change="getEvents" @click:event="viewEvent" @click:day="addEvent"
      >
      <!--template v-slot:day-header="{day}">
        XXX
      </template-->
      </v-calendar>
    </v-sheet>
      <v-dialog v-model="dialog" max-width="1000px" @keydown.esc.prevent="dialog = false" overlay-opacity="0.2">
        <v-card>
          <v-card-title><span class="text-h5">{{editMode=='add'?'Create':'Edit'}} Calendar Entry</span><v-spacer></v-spacer>
            <v-btn icon @click.stop="deleteEvent"><v-icon>mdi-trash-can</v-icon></v-btn></v-card-title>
          <v-card-text>
            <v-form ref="theForm" v-model="valid" lazy-validation>
              <v-text-field v-model="event.title" label="Title" :rules="[rules.required]"></v-text-field>
              <v-select v-model="event.type" :items="eventTypes" dense placeholder="event type" :rules="[rules.required]"></v-select>
              <v-switch label="All Day" v-model="event.allDay"></v-switch>
              <v-dialog v-model="datePickerDlg" max-width="290px" >
                <template v-slot:activator="{ on, attrs}">
                  <v-text-field :value="dateDisplay" :label="event.allDay?'Date range':'Date'" prepend-icon="mdi-calendar" readonly 
                    v-bind="attrs" v-on="on"></v-text-field>
                </template>
                  <v-date-picker v-if="event.allDay" v-model="event.dates" range >
                    <v-spacer></v-spacer><v-btn color="primary" text @click="datePickerDlg = false" >Done</v-btn>
                  </v-date-picker>
                  <v-date-picker v-else v-model="event.dates[0]">
                    <v-spacer></v-spacer><v-btn color="primary" text @click="datePickerDlg = false" >Done</v-btn>
                  </v-date-picker>                  
              </v-dialog>
              <v-input v-if="!event.allDay" label="Start Time" :hide-details="false" >
                <input class="ml-2" type="time" v-model="event.startTime" />
              </v-input>
              <v-input v-if="!event.allDay" label="End Time" :hide-details="false" >
                <input class="ml-2" type="time" v-model="event.endTime" />
              </v-input>
              <v-textarea v-model="event.content" label="Description"></v-textarea>
              <OrganizationAppPane v-if="editMode=='edit'" :application="event.app" :page="event.appPage"></OrganizationAppPane>
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
import OrganizationAppPane from './OrganizationAppPane.vue'
import moment from 'moment';

var eventTypeToColorMap = {
  Meeting: '#00528d',
  Holiday: '#df009c',
  PTO: '#ea0109',
  Travel: '#00b397',
  Event: '#73c934',
  Birthday: '#eb7a00',
  Conference: '#808080'
};
var defaultEvent = {
        _id: null,
        type: 'Event',
        dates: [null, null],
        startTime: '08:00',
        endTime: '09:00',
        color: eventTypeToColorMap['Event'],
        allDay: false,
        title: '',
        content: '',
        date: null,
        dateText: '',
        app: {},
        appPage: null
      };
  export default {
    components:{CHFileViewer, OrganizationAppPane},
    data: () => ({
      dialog: false,
      calendarValue: '',
      valid: true,
      rules: {
          required: value => !!value || 'Required.'
      },
      eventTypes: ['Event', 'Meeting', 'Conference', 'PTO', 'Travel',  'Birthday', 'Holiday'],
      datePickerDlg:false,
      event: {
        _id: null,
        type: 'Event',
        dates: [null,null],
        startTime: '',
        endTime: '',
        color: eventTypeToColorMap['Event'],
        allDay: false,
        title: '',
        content: '',
        dateText: null,
        app: {},
        appPage: null
      },
      searchText:'',
      events: [],
      curDate: new Date(),
      calendarMode: 'month',
      calendarModes: ['month', 'week', 'day', '4day'],
      weekday: [0, 1, 2, 3, 4, 5, 6],
      events: [],
      names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference'],
      editMode: 'add',
      lastStart: null,
      lastEnd: null
    }),

    computed: {
      dateDisplay () {
        var startDate = this.event.dates[0]?moment(this.event.dates[0]).format('l'):'';
        if (this.event.allDay) {
          var endDate = this.event.dates[1]?moment(this.event.dates[1]).format('l'):'';
          return `${startDate} to ${endDate}`;
        } else {
          return startDate;
        }
      },
      eventColor() {
        return eventTypeToColorMap[this.event.type];
      },
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
/*      EventBus.$on('calendar data refresh', () =>{
        loadCalendar();
      })
      this.loadCalendar();*/
    },
    methods: {
      lightenColor(color, percent) {
        var num = parseInt(color.replace("#",""),16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        B = (num >> 8 & 0x00FF) + amt,
        G = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
      },
      getEvents ({ start, end }) {
        var dStart = moment(start.date, 'YYYY-MM-DD').toDate()
        this.lastStart = dStart;
        var dEnd = moment(end.date, 'YYYY-MM-DD').add('day', 1).toDate();
        this.lastEnd = dEnd;
        this.loadCalendar(dStart, dEnd);
      },
      getEventColor (event) {
        var darkColor = this.lightenColor(event.color, -7);
        console.log(event.color+': '+darkColor);
        return darkColor;
      },
      loadCalendar( start, end) {
        start = start || this.lastStart;
        end = end || this.lastEnd;
        (async () => {
          var response = await Api().post('/calendarmgr/getevents',{start: start, end: end});
          var events = (response.data||[]).map(e=>(
            {
              color: eventTypeToColorMap[e.type],
              name: e.title,
              start: moment(e.start).toDate(),
              end: e.end?moment(e.end).toDate():null,
              allDay: e.durationType=='allday',
              dbEvent: e
            }
          ));
          this.events = events;
        })();
      },
      cancel() {
        this.dialog = false;
      },
      addEvent (dateObj) {
        if (this.dialog) return;
        this.editMode = 'add';
        this.event = Object.assign({}, defaultEvent);
        this.event.dates[0] = dateObj.date+'';
        this.event.dates[1] = dateObj.date+'';
        this.dialog = true;
      },
      viewEvent( event ) {
        var dbEvent = event.event.dbEvent;
        this.event.dbEvent = dbEvent;
        this.event._id = dbEvent._id;
        this.editMode = 'edit';
        this.event.title = dbEvent.title;
        this.event.content = dbEvent.content;
        this.event.type = dbEvent.type;
        this.event.allDay = dbEvent.durationType == 'allday';
        var end = (dbEvent.end)?moment(dbEvent.end).startOf('day').toISOString().substr(0, 10):null;
        this.event.dates = [moment(dbEvent.start).startOf('day').toISOString().substr(0, 10), end ];
        this.event.startTime = this.event.allDay?'':moment(dbEvent.start).format("HH:mm");
        this.event.endTime = this.event.allDay?'':(dbEvent.end?moment(dbEvent.end).format('HH:mm'):'');
        this.event.app = {applicationId:"test-app", organizationId:"603ee28599a16849b4870d5b", name:'Test App', url:'http://localhost:3300/api/sandboxapp'},
        this.appPage = "home";
        event.nativeEvent.stopPropagation();
        this.dialog = true;
      },

      deleteEvent () {
        this.$store.commit('SET_RESULTNOTIFICATION', '');
        if (confirm('Are you sure you want to delete '+this.event.title+'?')) {
          (async () => {
            var response = await Api().delete(`/calendarmgr/deleteevent/${this.user._id}/${this.event.dbEvent._id}`);
            if (this.$safeRef(response.data).success) {
              this.loadCalendar();
              this.$store.commit('SET_SUCCESS', `${this.event.title} deleted.`);
            }
            this.dialog = false;
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
        if (!this.event.allDay) {
          if (!this.event.startTime) {
            alert('Please enter a start time.');
            return;
          }
          if (!this.event.endTime) {
            alert('Please enter an end time.');
            return;
          }
        }
        (async () => {
          var e = this.event;
          var end = this.event.allDay?moment(this.event.dates[1], 'YYYY-MM-DD').add(1, 'day').toDate():moment(this.event.dates[1]+this.event.endTime, 'YYYY-MM-DDHH:mm').toDate();
          var start = this.event.allDay?moment(this.event.dates[0], 'YYYY-MM-DD').toDate():moment(this.event.dates[0]+this.event.startTime, 'YYYY-MM-DDHH:mm').toDate();
          var response = await Api().post(`/calendarmgr/${this.event._id?'updateevent':'createevent'}`,
            {
              userId: this.user._id,
              _id: this.event._id,
              type: this.event.type,
              title: this.event.title,
              content: this.event.content,
              durationType: this.event.allDay?'allday':'timed',
              start: start,
              end:end,
            });
          if (response.data.success) {
            this.loadCalendar();
            EventBus.$emit('global success alert', `${this.event.type} ${this.event.title} ${this.editMode=='add'?'added':'saved'}.`);
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg);

          }
          this.dialog = false;
        })();
      }
    }
  }
</script>