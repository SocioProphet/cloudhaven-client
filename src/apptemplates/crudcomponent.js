/* example dataConfig:
    [
      { text: 'Date', align: 'start', sortable: true, path: 'date', dataType: 'date', required:true, defaultValue: new Date() },
      { text: 'Short Name', align: 'left', sortable:true, path: 'shortName', dataType: 'string', required:true },
      { text: 'Description', align: 'left', sortable: true, path: 'description', dataType: 'string', required:true },
      { text: 'Location', align: 'left', sortable: true, path: 'location', dataType: 'string', required:true }
      
    ],
*/
export default `
var uiConfig = {
  props: {
    label: { type: String, required: true},
    dbTableName: {type: String, required: true},
    keyFields: { type: Array, required: true},
    dataConfig: { type: Array, required: true}
  }
  dataModel:{
    dialog: false,
    editedItem: {},
    editedIndex: -1,
    events: []
  },
  computed: {
    headers:
      body: \`
        return this.dataConfig.map(c=>{
          var o = _.pick(c,["text", "align", "sortable"]);
          o.value = c.path;
          return o;
        }).concat([{ text: 'Actions', align: 'center', sortable: false }]);
      \`
    },
    defaultValue:
      body: \`
      return this.dataConfig.reduce((mp, c)=>{
        this._deepSet(mp, c.path, c.defaultValue || '');
        return mp;
      },{})
      \`
    }
  },
  methods: {
    mounted: {
      body: \`
        this.getItems();
      \`
    },
    required: {
      args:["value"],
      body:\`
        return !!value || 'Required.';
      \`
    },
    getRules: {
      args: ["path"],
      body: \`
        var fieldConfig = this.dataConfig.find(c=>(c.value==path));
        if (fieldConfig) {
          return fieldConfig.required?[this.required]:[];
        }
      \`
    },
    getItems: {
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
        this.editedItem = Object.assign({}, this.defaultEvent);
        this.dialog = true;
      \`
    },
    editEvent: {
      args: ["item"],
      body: \`
        this.editedItem = Object.assign({}, item);
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
           this.getItems();
         } else {
           this._showError('Delete failed: '+result.errMsg);
         }
       })
     \`
    },
    save: {
      body: \`
        if (!this.$refs.theForm.validate()) return;
        var key = this.editedItem.shortName+':'+this._moment(this.editedItem.date).format('YYYY-MM-DD');
        var jsonEvent = JSON.stringify(this.editedItem);
        this._writeAppData({table:this.dbTableName, key:key, dataString:jsonEvent}, function(result) {
          if (result.success) {
            this._showNotification('Event '+ key + (!this.editedItem._id?' added.':' updated.'));
            this.getItems();
            this.dialog = false;
          } else {
            this._showError('Event ' + (!this.editedItem._id?' add':' updated') + ' failed ('+result.errMsg+').');
          }
        });
      \`
    }
        
  },
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
                vmodel: 'editedItem.date', props: { label: 'Date', :"rules":"getRequired('date')" } },
              { component: 'textField', vmodel: 'editedItem.shortName', props: {  label: 'Short Name', :"rules":"getRequired('date')" } },
              { component: 'textarea', vmodel: 'editedItem.description', props: { rows:"4", label: 'Description', :"rules":"getRequired('date')" } },
              { component: 'textarea', vmodel: 'editedItem.location', props: { rows:"3", label: 'Location', :"rules":"getRequired('date')" } }
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