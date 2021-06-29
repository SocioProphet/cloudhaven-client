export default `var uiConfig = {
  dataModel:{
    userSearchFilter:'',
    selectedUser: null,
    userOptions: [],
    valid: true,
    rules: {
      required: value => !!value || 'Required.',
      requiredObject: value => (value && value._id!='') || 'Required.',
    },
    timeoutId: '',
    subject:'',
    message:'',
    organizationId:'',
    applicationId:''
  },
  methods: {
    mounted: {
      args:[],
      body: \`
       \`
    },
    onSearchFilterChange: {
      body:\`
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.fetchUserOptions();
      }, 500);\`
    },
    fetchUserOptions: {
    body: \`
      this._usersSearch({searchPhrase: this.userSearchFilter}, function(users) {
        this.userOptions = users;
      });
    \`
    },
    sendTaskMsg: {
      body: \`
      debugger;
      if (!this.$refs.theForm.validate()) return;
      this._queueUserMessageOrTask({
        senderId:this._currentUser._id,
        recipients:[{type:'to', email:this.selectedUser.email}],
        subject:this.subject,
        message:this.message,
        application:{organizationId:this.organizationId, applicationId:this.applicationId}}, function(result) {
        if (result.success) {
          console.log('msgId: '+result.msg._id);
          this._showNotification("Message sent.");
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
            {component: "textField", vmodel:"userSearchFilter", props:{label:"User Search Filter",
              "persistent-hint":true, hint:"Space-separated phrases to be searched in email/first name/last name.", "append-outer-icon":"mdi-magnify"}, 
               on:{input:'onSearchFilterChange', 'click:append-outer':"onSearchFilterChange"}, "class":"mr-2"},
            {component: "select", vmodel:"selectedUser", props:{":label":"userSearchFilter?'Select User':''", ":items":"userOptions",
              "item-value":"_id", "item-text":"name", "return-object":true, ":rules":"[rules.requiredObject]"}},
            {component: "textField", props:{label:"Subject", ":rules":"[rules.required]"}, vmodel:"subject"},
            {component: "textField", props:{label:"Organization Id", ":rules":"[rules.required]"}, vmodel:"organizationId"},
            {component: "textField", props:{label:"Application Id", ":rules":"[rules.required]"}, vmodel:"applicationId"},
            {component: "textarea", props:{label:"Message", rows:"5", "auto-grow":true}, vmodel:"message"}
          ]}
        ]},
        {component: "cardActions", contents: [
          {component: "spacer"},
          {component: "button", props:{elevation:"2", color:"blue darken-1", text:true}, on:{"click.native":"sendTaskMsg"}, contents:[
            {component: "icon", props:{left:true, dark:true}, contents:"mdi-send"},
            "Save"
          ]}
        ]}
      ]}
    ]
  }
};
`