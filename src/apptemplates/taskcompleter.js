export default `var uiConfig = {
  dataModel:{
    messageOrTask: {},
    resultStatus: 'Completed',
    resultText: '',
    appConfigData: ''
  },
  methods: {
    mounted: {
      args:[],
      body: \`
        this.messageOrTask = this._app.messageOrTask;
        if (this._app.appConfigData) {
          this.appConfigData = JSON.stringify(this._app.appConfigData);
        }
      \`
    },
    setTaskOutcome: {
      body: \`
        this._setTaskOutcome( {taskId: this.messageOrTask._id, resultStatus:this.resultStatus, resultText:this.resultText}, function( result ) {
          if (result.success) {
            this._showNotification('Task result status set to '+this.resultStatus+'.');
          } else {
            if (result.errMsg) {
              this._showError(result.errMsg);
            }
          }
        })
      \`
    }
  },
  components: [],
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', template:"<span>Set Task {{_app.name}} Outcome</span>" },
        {component: 'cardText', contents: [
          {component: "div", template:"<span>{{appConfigData}}</span>"},
          {component: "form", props:{width:"700px"}, contents: [
            {component: "radioGroup", vmodel:"resultStatus", props:{row:true, ":readonly":"messageOrTask.isDone"}, contents: [
              {component: "radio", props:{label:"Incomplete", value:"Incomplete"}},
              {component: "radio", props:{label:"Completed", value:"Completed"}}
            ]},
            {component: "textarea", props:{rows:"3", "auto-grow":true, label:"Result Description", 
              ":readonly":"messageOrTask.isDone"}, vmodel:"resultText"}
          ]} //form
        ]}, //cardText
        {component: "cardActions", omit:"messageOrTask.isDone", contents: [
          {component:"spacer"},
          {component: "button", contents:"Submit", on:{"click.native":"setTaskOutcome"}}
        ]}
      ]} //card
    ]
  }
};
`