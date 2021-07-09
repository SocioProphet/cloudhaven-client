export default `
var uiConfig = {
  dataModel:{
    datePickerDlg:false,
    userSearchFilter:'',
    timeoutId:'',
    selectedUser: null,
    userOptions: [],
    valid: true,
    rules: {
      required: value => !!value || 'Required.',
      requiredObject: value => (value && value._id!='') || 'Required.',
    },
    event: {
      _id: null,
      type: 'Event',
      dates: [null,null],
      date: '',
      startTime: '',
      endTime: '',
      color: '#73c934',
      allDay: false,
      title: '',
      content: '',
      dateText: null,
      organizationId:'',
      applicationId:''		
    },
  },
  computed: {
    dateDisplay: {
      body: \`
        if (this.event.allDay) {
          var startDate = this.event.dates[0]?this._moment(this.event.dates[0]).format('l'):'';
          var endDate = this.event.dates[1]?this._moment(this.event.dates[1]).format('l'):'';
          return startDate+ ' to '+endDate;
        } else {
          return this.event.date?this._moment(this.event.date).format('l'):'';
        }
      \`
    }
  },
  methods: {
    created: {
      body: \`
        this.$set(this.event.dates, 0, this._moment().format('YYYY-MM-DD'));
        this.$set(this.event.dates, 1, this._moment().format('YYYY-MM-DD'));
		    this.event.date =  this._moment().format('YYYY-MM-DD');
      \`
    },
    onSearchFilterChange: {
      body:\`
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.fetchUserOptions();
      }, 500);
      \`
    },
    fetchUserOptions: {
    body: \`
      this._usersSearch({searchPhrase: this.userSearchFilter}, function(users) {
        this.userOptions = users;
      });
    \`
    },
    createEvent: {
      body: \`
      if (!this.$refs.theForm.validate()) return;
      var end = this.event.allDay?this._moment(this.event.dates[1], 'YYYY-MM-DD').toDate():this._moment(this.event.date+this.event.endTime, 'YYYY-MM-DDHH:mm').toDate();
      var start = this.event.allDay?this._moment(this.event.dates[0], 'YYYY-MM-DD').toDate():this._moment(this.event.date+this.event.startTime, 'YYYY-MM-DDHH:mm').toDate();
      this._addCalendarEntry({
        ownerId: this._currentUser._id,
        type: this.event.type,
        title:this.event.title,
        content:this.event.content,
        start: start,
        end: end,
        durationType:this.event.allDay?"allday":"timed",
        organizationId:this.event.organizationId,
        applicationId:this.event.applicationId,
        appConfigData:{}
        }, function(response ) {
        if (response.success) {
          console.log('msgId: '+response.newEvent._id);
          this._showNotification("Event created.");
        } else if (response.errMsg) {
          this._showError(response.errMsg);
        }
      });
      \`
    }
},
  components: [],
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', template: "<span>{{_app.name}}</span>" },
        {component: 'cardText', contents: [
          {component: "form", ref:"theForm", vmodel:"valid", props:{"lazy-validation":true}, contents: [
            {component: "textField",  vmodel:"event.title", props:{label:"Title", ":rules":"[rules.required]"}},
            {component: "textField",  vmodel:"event.type", props:{label:"Event Type"}},
            {component: "switch", props:{label:"All Day"}, vmodel:"event.allDay"},
            {component: "template", template:"<span>{{JSON.stringify(event.dates)}}</span>"},
            {component: "dialog", vmodel:"datePickerDlg", props:{"max-width":"290px"}, scopedSlots: {
              activator: {component: "textField", props:{":value":"dateDisplay", ":label":"event.allDay?'Date Range':'Date'",
              "prepend-icon":"mdi-calendar", readonly:true}, ":attrs":"attrs", on:"on"}
              }, contents: [
              {component: "datePicker", show:"event.allDay", vmodel:"event.dates", props:{range:true}, contents: [
                {component: "spacer"},
                {component: "button", props:{color:"primary", text:true}, on:{click:"datePickerDlg = false"}, contents:"Done"}
              ]},
              {component: "datePicker", omit:"event.allDay", vmodel:"event.date", contents: [
                {component: "spacer"},
                {component: "button", props:{color:"primary", text:true}, on:{click:"datePickerDlg = false"}, contents:"Done"}
              ]}
            ]},
            {component: "vinput", show:"!event.allDay", props:{label:"Start Time", ":hide-details":"false"}, contents: [
              {component: "input", class:"ml-2", attrs:{type:"time"}, vmodel:"event.startTime"}
            ]},
            {component: "vinput", show:"!event.allDay", props:{label:"End Time", ":hide-details":"false"}, contents: [
              {component: "input", class:"ml-2", attrs:{type:"time"}, vmodel:"event.endTime"}
            ]},
            {component: "textField", vmodel:"event.organizationId", props:{label:"Organization Id"}},
            {component: "textField", vmodel:"event.applicationId", props:{label:"Application Id"}},
            {component: "textarea", vmodel:"event.content", props:{label:"Description"}}
          ]}		  
        ]},
        {component: "cardActions", contents: [
          {component: "spacer"},
          {component: "button", props:{elevation:"2", color:"blue darken-1", text:true}, on:{"click.native":"createEvent"}, contents:[
            {component: "icon", props:{left:true, dark:true}, contents:"mdi-plus"},
            "Create"
          ]}
        ]}
      ]}
    ]
  }
};

`