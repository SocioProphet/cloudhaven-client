export default `
var uiConfig = {
  dataModel:{
    dialog: false,
    editedEvent: {},
    headers: [
      { text: 'Date', align: 'start', sortable: true, value: 'date' },
      { text: 'Short Name', align: 'left', sortable:true, value: 'shortName' },
      { text: 'Description', align: 'left', sortable: true, value: 'description' },
      { text: 'Location', align: 'left', sortable: true, value: 'location' },
      { text: 'Actions', align: 'center', sortable: false }
    ],
    defaultEvent: { date: new Date(), shortName:'', description:'', location: ''},
    editedIndex: -1,
    events: [],
    dbTableName: 'DemoEventsAppData'
  },
  methods: {
    mounted: {
      body: \`
        this.getEvents();
      \`
    },
    required: {
      args:["value"],
      body:\`
        return !!value || 'Required.';
      \`
    },
    getEvents: {
      body: \`
        this._readAppData({table:this.dbTableName}, function(result) {
          if (result.success) {
            this.events = result.data.map((r)=>{
              var event = JSON.parse(r.jsonData);
              event._id = r._id;
              return event;
            });
          }
        });
      \`
    },
    initEvent: {
      body:\`
      this.event  = Object.assign({}, this.defaultEvent);
      \`
    },
    addEvent: {
      args: ["item"],
      body: \`
        this.editedEvent = Object.assign({}, this.defaultEvent);
        this.dialog = true;
      \`
    },
    editEvent: {
      args: ["item"],
      body: \`
        this.editedEvent = Object.assign({}, item);
        this.dialog = true;
      \`
    },
    deleteEvent: {
     args: ["item"],
     body: \`
       if (!confirm("Are you sure you want to delete "+item.shortName + "?")) return;
       this._deleteAppData( {table:this.dbTableName, id:item._id}, function(result) {
         if (result.success) {
           this._showNotification('Event '+ item.shortName + ' delete.');
           this.getEvents();
         } else {
           this._showError('Delete failed: '+result.errMsg);
         }
       })
     \`
    },
    save: {
      body: \`
        if (!this.$refs.theForm.validate()) return;
        var key = this.editedEvent.shortName+':'+this._moment(this.editedEvent.date).format('YYYY-MM-DD');
        var jsonEvent = JSON.stringify(this.editedEvent);
        this._writeAppData({table:this.dbTableName, key:key, dataString:jsonEvent}, function(result) {
          if (result.success) {
            this._showNotification('Event '+ key + (!this.editedEvent._id?' added.':' updated.'));
            this.getEvents();
            this.dialog = false;
          } else {
            this._showError('Event ' + (!this.editedEvent._id?' add':' updated') + ' failed ('+result.errMsg+').');
          }
        });
      \`
    }
        
  },
  computed: {
    formTitle:"return this.editedEvent._id? 'Edit Event' : 'New Event'"
  },
  filters: {
    date: {
      args: ["value"],
      body: "return value?this._moment(value).format('l'):'';"
    }
  },
  components: [],
  mixins: [],
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: [
          {component: "span", contents: "Demo: Events"}, {component: "spacer"},
          { component: 'button', props:{elevation:"2"}, on: {  "click.stop": 'addEvent' }, contents: "Add Event" }
        ] },
        {component: 'cardText', contents: [
           { component: 'dataTable', class: 'elevation-1', props: {  ":headers": 'headers',  ":items": 'events' }, scopedSlots: {
             item:{ component: 'tr', contents:[
               { component: 'template', template:"<td>{{item.date | date}}</td>"},
               { component: 'template', template:"<td>{{item.shortName}}</td>"},
               { component: 'template', template:"<td>{{item.description}}</td>"},
               { component: 'template', template:"<td>{{item.location}}</td>"},
               { component: 'td', class:"d-flex justify-center align-center", contents: [
                 { component: 'button', props: {  icon: true }, contents: [
                  { component: 'icon', on:{"click.stop":"editEvent(item)"}, contents: "mdi-pencil" }
                 ] },
                 { component: 'button', props: {  icon: true }, contents: [
                  { component: 'icon', on:{"click.stop":"deleteEvent(item)"}, contents: "mdi-trash-can" }
                 ] }
               ]} //td
             ] } //tr
           }} //dataTable
        ]} //cardText
      ]}, //card
      { component: 'dialog', vmodel: 'dialog', props: {  'max-width': '600px',  'overlay-opacity': '0.2' },
        on: {"keydown.esc": 'dialog=false' }, contents: [
        {component: 'card', props: { elevation: 2 }, contents: [
          {component: 'cardTitle', template: "<span>{{formTitle}}</span>"},
          {component: 'cardText', contents: [
            { component: 'form', ref: 'theForm', props:{"lazy-validation":true}, contents: [
              { component: 'dynamicComponent', organizationId: 'cloudhaven', componentId: 'ch-date-field', 
                vmodel: 'editedEvent.date', props: { label: 'Date', ":rules":"[required]" } },
              { component: 'textField', vmodel: 'editedEvent.shortName', props: {  label: 'Short Name', ":rules":"[required]" } },
              { component: 'textarea', vmodel: 'editedEvent.description', props: { rows:"4", label: 'Description', ":rules":"[required]" } },
              { component: 'textarea', vmodel: 'editedEvent.location', props: { rows:"3", label: 'Location', ":rules":"[required]" } }
            ] } //form
          ]}, //cardText
          {component: "cardActions", contents:[
            {component: "button", props:{color:"blue darken-1", text:true, elevation:"1"}, on:{click:"dialog=false"}, contents:"Cancel"},
            {component: "spacer"},
            {component: "button", props:{color:"blue darken-1", text:true, elevation:"1"}, on:{click:"save"}, contents:"Save"},
          ]}
        ]}, //card        
      ] } //dialog
    ]
  } //container
};
`