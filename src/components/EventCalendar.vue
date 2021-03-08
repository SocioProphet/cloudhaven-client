<template>
  <v-container class="fluid justify-start align-start ma-0 pa-0"> 
  <v-row class="flex-column ma-0 pa-0">
  <v-col class="pr-0">
    <v-row sm="12" md="12" lg="12" class="align-center full-height" color="black">
      <v-col sm="4" md="2" lg="2">
        <v-col v-if="false" shrink>
          <v-tooltip right transition="scale-transition" offset-overflow nudge-left="10px" color="#1E5AC8" light>
          <template v-slot:activator="{ on, attrs }">
            <drag :draggable="true" @dragstart="dragStart" @dragend="dragEnd" :transfer-data="{someId:someId}" v-bind="attrs" v-on="on" v-bind:style="{'font-weight':'bold','font-size':'16px'}" class="elevation-2">
              {{'FIXME'}}<br/>
            </drag>
          </template>
            <span>"event details"</span>
          </v-tooltip>
        </v-col>
        <v-col grow></v-col>
      </v-col>
      <v-col sm="4" md="8" lg="8" style="width:50%;text-align:center" class="justify-center">
        <span class="text-h4">{{monthName}}</span>
      </v-col>
      <v-col sm="4" md="2" lg="2" class="justify-end align-self-end">
        <v-row class="justify-end ma-0 pa-0">
        <v-tooltip bottom color="#2572d2">
          <template v-slot:activator="{ on, attrs }">
          <v-btn color="grey.lighten-2" @click="prevMonth()" v-bind="attrs" v-on="on">
            <v-icon dark>mdi-calendar-arrow-left</v-icon>
          </v-btn>
          </template>
          <span>Previous Month</span>
        </v-tooltip>
        <v-tooltip bottom color="#2572d2">
          <template v-slot:activator="{ on, attrs }">
            <v-btn color="grey.lighten-2" @click="nextMonth()" v-bind="attrs" v-on="on">
              <v-icon dark>mdi-calendar-arrow-right</v-icon>
            </v-btn>
          </template>
          <span>Next Month</span>
        </v-tooltip>
        </v-row>
      </v-col>
    </v-row>
    <v-progress-linear :indeterminate="indeterminate" value="0"></v-progress-linear>
  </v-col>
  <v-col >
    <v-row class="align-start">
    <v-col v-if="true" sm="4" md="2" lg="2" class="mr-3">
        <v-data-table
          :headers="headers"
          :items="events"
          hide-default-footer disable-pagination
          no-data-text="No unscheduled events"
          class="elevation-2"
        >
          <template v-slot:item="{ item }">
            <tr>
            <td class="shadow">
              <drag :draggable="true" @dragstart="dragStart" @dragend="dragEnd" :transfer-data="{eventId:item.id}">
              <v-tooltip top transition="scale-transition" offset-overflow nudge-bottom="10px" color="#1E5AC8" light>
                <template v-slot:activator="{ on, attrs }">
                  <div v-bind="attrs" v-on="on" >
                    "some detail"<br/>
                  </div>
                </template>
                <span>"some detail</span>
              </v-tooltip>
              </drag>
            </td>
            </tr>
          </template>
        </v-data-table>
    </v-col>
    <v-col >
    <v-row class="align-content-center">
      <v-col v-for="(weekDay, index) in weekDays" :key="index" class="dayHeader my-0 py-0" v-bind:class="{leftBorder:(index==0)}" >{{weekDay}}</v-col>
    </v-row>
    <v-row v-for="(week, index) in weeks" :key="index" fill-height>
      <v-col v-for="(dayObj, wdIdx) in weeks[index].days" :key="wdIdx" class="xxx dayCell ma-0 pa-0" 
        v-bind:class="{leftBorder:(wdIdx==0)}" v-bind:style="dayObj.style" >
        <drop class="drop" @drop="handleDrop" :id="dayObj.dayKey" v-bind:style="{'min-height':week.height+'px'}">
        <v-row class="ma-0 pa-0 justify-space-between align-start fill-height">
          <v-row class="flex-column ma-0 pa-0 justify-start fill-height"  :style="dropStyle">
            <v-col class="ma-0 pa-0" v-bind:style="'margin-top: 3px!important'"></v-col>
            <v-col v-for="(event, index) in dayDataMap[dayObj.dayKey]" :key="index" class="ma-0 pa-0">
              <drag @dragstart="dragStart" @dragend="dragEnd" :transfer-data="{dayKey:dayObj.dayKey, eventId:event.id}">
              <v-tooltip top transition="scale-transition" offset-overflow nudge-bottom="10px" color="#1E5AC8" light>
                <template v-slot:activator="{ on, attrs }">
                <!--div v-bind="attrs" v-on="on" v-bind:class="scheduledEvent(event)" @click="gotoEvent(event.id)">
                  "name<div style="margin-top:-7px" v-if="needsAccept( event)"><v-icon small>mdi-check</v-icon>&nbsp;<a href="#" @click.prevent="acceptEvent(event)">accept</a></div>
                </div-->
                </template>
                <span>"some detail"</span>
              </v-tooltip>
              </drag>
            </v-col>
          </v-row>
        </v-row>
        </drop>
          <v-row class="zzz justify-end align-self-end mx-0 pr-0 dayNum" v-bind:class="{notCurMonthDay:!dayObj.isCurMonth}" v-bind:style="dayObj.isToday?{fontWeight:'bold'}:{}">
            <div style="position:relative;top:5px; right:2px">{{dayObj.day}}</div>

            </v-row>
      </v-col>
    </v-row>
    </v-col>
    </v-row>
  </v-col>
  </v-row>

  </v-container>
</template>

<script>
  import moment from 'moment'
  import Api from '@/services/Api'
  import { mapState } from 'vuex'
  import router from '../router'
  export default {
    data: () => ({
      firstDayOfMonth: moment().startOf('month'),
      availableDaysMap: {},
      weeks:[],
      dayDataMap:{},
      dayAvailabilityMap: {},
      indeterminate: true,
      percentLoaded: 0,
      headers: [
          { text: 'Unscheduled', align: 'left' }
      ],
      dropCursor:'auto'
    }),
    computed: {
      dropStyle() {
        return {cursor:this.dropCursor, height:'100%'};
      },
      ...mapState([ 'user', 'routerParams']),
      monthName() {
        return this.firstDayOfMonth?this.firstDayOfMonth.format('MMMM'):'';
      },
      weekDays() {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      }
    },
    created() {
    },
    mounted() {
      this.$store.commit('SET_ERRMSG', '');
      this.initMonth();
    },
    methods: {
      setDayStyle( dayKey, dayObj) {
        var styleObj = dayObj.style || {};
        var date = moment( dayKey, 'YYYY-MM-DD');
        var dayAvailability = this.dayAvailabilityMap[dayKey] || {isAvailable:true};
        var today = moment().startOf('day');
        if (date.isBefore(today) || !dayAvailability.isAvailable) {
          styleObj.backgroundColor = '#E8E8E8';
        } else if (dayAvailability.confirmedExceedsCapacity) {
          styleObj.backgroundColor = 'Red';
        } else if (dayAvailability.exceedsCapacity) {
          styleObj.backgroundColor = 'DarkOrange';
        } else if (date.isSame(today, 'day')) {
          styleObj.backgroundColor = 'MistyRose';
        } else {
          styleObj.backgroundColor = 'white';
        }
        dayObj.style = styleObj;
      },
      dragStart(xferData, ev) {
        if (true) {
          ev.preventDefault();
          return;
        }
        this.$store.commit('SET_ERRMSG', '')
        var today = moment().startOf('day');
        var lowBound = this.weeks[0].days[0].mDate.startOf('day');
        var highBound = this.weeks[5].days[6].mDate.add(1, 'days').startOf('day');
        if (lowBound.isBefore(today)) lowBound = today;
        this.repaint(this.weeks, this.dayDataMap);
      },
      dragEnd() {
        this.dayAvailabilityMap = {};
        this.repaint(this.weeks, this.dayDataMap);
      },
      handleDrop( xferData, dragEvent ) {
        if (true) {
          return;
        }
        var dayKey = dragEvent.currentTarget.id;
        var dayAvailability = this.dayAvailabilityMap[dayKey] || {isAvailable:true};
        if (moment(dayKey, 'YYYY-MM-DD').isBefore(moment().startOf('day'))) {
          dragEvent.preventDefault();
          alert('Please schedule to a day that is not in the past.');
          return false;
        } else if (!dayAvailability.isAvailable) {
          dragEvent.preventDefault();
          alert('Please schedule on a day when all participants are available.');
          return false;
        } else if (dayAvailability.confirmedExceedsCapacity) {
          dragEvent.preventDefault();
          alert('Please schedule to a day that has not exceeded its capacity.');
          return false;
        }
      },
      calcWeeks() {
        var mToday = moment().startOf('day');
        var _weeks = [];
        var dayOfWeek = this.firstDayOfMonth.day();
//        var curMonth = this.firstDayOfMonth.month();
        var curDay = moment(this.firstDayOfMonth).subtract( dayOfWeek, 'days');
        for (var weekIdx=0;weekIdx<6;weekIdx++) {
          var week = {height:100, days:[]};
          _weeks.push(week);
          for (var dayIdx=0;dayIdx<7;dayIdx++) {
            week.days.push({mDate:moment(curDay), day:curDay.date(), dayKey:curDay.format('YYYY-MM-DD'),
              isCurMonth:curDay.isSame(this.firstDayOfMonth, 'month'),
              isToday: curDay.isSame(mToday, 'day')});
            curDay.add(1, 'days');
          }
        }
        return _weeks;
      },
      prevMonth() {
        this.firstDayOfMonth = moment(this.firstDayOfMonth).subtract(1, 'months');
        this.initMonth();
      },
      nextMonth() {
        this.firstDayOfMonth = moment(this.firstDayOfMonth).add(1, 'months');
        this.initMonth();
      },
      initMonth() {
        this.indeterminate = true;
        this.percentComplete = 0;
        var _dayDataMap = {};
        var today = moment().startOf('day');
        var weeks = this.calcWeeks();
        var lowBound = moment(weeks[0].days[0].mDate).startOf('day').toDate();
        var highBound = moment(weeks[5].days[6].mDate).add(1, 'days').startOf('day').toDate();
        (async () => {
          var postData = {lowBound:lowBound, highBound:highBound};
          var response = await Api().post('/calendarscheduling/schedulingevents', postData);
          var events = response.data;
          this.repaint(weeks, _dayDataMap);
          this.dayDataMap = _dayDataMap;
          this.weeks = weeks;
          this.indeterminate = false;
          this.percentComplete = 100;
        })();
      },
      repaint(weeks, dayDataMap) {
          weeks.forEach(wk=>{
            var maxBookings = wk.days.reduce((cnt,day)=>{
              this.setDayStyle(day.dayKey, day);
              var dayList = dayDataMap[day.dayKey]||[];
              if (dayList.length>cnt) cnt = dayList.length;
              return cnt;
            },0);
            var height = maxBookings * 23;
            wk.height = height<100?100:height;
          })

      }
    }
  }
</script>

<style scoped>
  thead.v-data-table-header th {
    font-weight:bold !important;
    font-size:20px !important;
  }
  .leftBorder {
    border-left: 1px solid lightgray;
  }
  .dayHeader {
    width: 14.3%;
    background-color: white;
    border-top: 1px solid lightgray;
    border-right: 1px solid lightgray;
    border-bottom: 1px solid lightgray;
    text-align: center;
  }
  .dayCell {
    width: 14.3%;
    min-height: 90px;
    background-color: white;
    border-right: 1px solid lightgray;
    border-bottom: 1px solid lightgray;
  }
  .notCurMonthDay {
    color:#B0B0B0 !important;
  }
  .dayNum {
    padding:1px 1px 0px 0px!important;
    color: #303030;
  }
  .tentative {
    background-color: #FFF007;
    text-align: center;
    border-radius: 10px 10px 10px 10px;
    border: 1px solid #1E5AC8;
    margin-bottom: 1px;
    font-size: 13px;
    color: #000000;
  }
  .booked {
    background-color: #00FF00;
    text-align: center;
    border-radius: 10px 10px 10px 10px;
    border: 1px solid #1E5AC8;
    margin-bottom: 1px;
    font-size: 13px;
    color: #000000;
  }
  .completed {
    background-color: #FFFFFF;
    text-align: center;
    border-radius: 10px 10px 10px 10px;
    border: 1px solid #000000;
    margin-bottom: 1px;
    font-size: 13px;
    color: #000000;
  }
  .shadow {
    -moz-box-shadow:    inset 0 0 10px #A0A0A0;
    -webkit-box-shadow: inset 0 0 10px #A0A0A0;
    box-shadow:         inset 0 0 10px #A0A0A0;
  }

.drag {
  font-family: sans-serif;
  display: inline-block;
  border-radius: 10px;
  background: #ccc;
  position: relative;
  padding: 30px;
  text-align: center;
  vertical-align: top;
}

.drag {
  color: #fff;
  cursor: move;
  background: #777;
  border-right: 2px solid #555;
  border-bottom: 2px solid #555;
}

</style>
