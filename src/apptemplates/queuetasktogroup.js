export default `var uiConfig = {
  dataModel:{
    task: {
      taskGroup: {
        organizationId: '',
        groupName: '',
      },
      subject:'',
      message:'',
      application: {
        organizationId:'cloudhaven',
        applicationId:'example-complete-task-app',
        appConfigData: {data:"here is some example app data"}
      }
    },      
    valid: true,
    rules: {
      required: value => !!value || 'Required.'
    }
  },
  methods: {
    mounted: {
      args:[],
      body: \`
       \`
    },
    queueTaskToGroup: {
      body: \`
      if (!this.$refs.theForm.validate()) return;
      this._queueTask(this.task, function(result) {
        if (result.success) {
          console.log('msgId: '+result.newTask._id);
          this._showNotification("Task queued to group "+this.task.taskGroup.groupName+".");
        } else {
          this._showError(result.errMsg);
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
            {component: "textField", vmodel:"task.taskGroup.organizationId", props:{label:"Group Organization Id", ":rules":"[rules.required]"}},
            {component: "textField", vmodel:"task.taskGroup.groupName", props:{label:"Group Name", ":rules":"[rules.required]"}},
            {component: "textField", props:{label:"Subject", ":rules":"[rules.required]"}, vmodel:"task.subject"},
            {component: "textField", props:{label:"App Organization Id", ":rules":"[rules.required]"}, vmodel:"task.application.organizationId"},
            {component: "textField", props:{label:"App Application Id", ":rules":"[rules.required]"}, vmodel:"task.application.applicationId"},
            {component: "textarea", props:{label:"Message", rows:"5", "auto-grow":true}, vmodel:"task.message"},
          ]}
        ]},
        {component: "cardActions", contents: [
          {component: "spacer"},
          {component: "button", props:{elevation:"2", color:"blue darken-1", text:true}, on:{"click.native":"queueTaskToGroup"}, contents:[
            {component: "icon", props:{left:true, dark:true}, contents:"mdi-send"},
            "Send"
          ]}
        ]}
      ]}
    ]
  }
};

`