var uiConfig = {
  dataModel:{
    user:{
      _id: '',
      email:'',
      firstName:'',
      lastName:'',
      phone: '',
      streetAddress:'',
      city: '' 
    },
    usersSearchFilter: '',
    usersSearchHeaders:[
      { text: 'Email', align: 'left', sortable: true, value: 'email' },
      { text: 'First Name', align:'left', sortable:true, value: 'firstame' },
      { text: 'Last Name', align:'left', sortable:true, value: 'lastame' }
    ],
    usersSearchItems: [],
    auxUserFields: ["phone", "streetAddress", "city"]
  },
  methods: {
    mounted: {
      args:[],
      body: ''
    },
    onEmailBlur: {
      args:["event"],
      body:'\
        this._lookupUser({email:this.user.email}, function(user) {\
          if (!user) return;\
          this.user._id = user._id;\
          this.user.firstName = user.firstName;\
          this.user.lastName = user.lastName;\
          this._getUserData([user._id], this.auxUserFields, function(results) {\
            var readUserData = results[user._id];\n\
            if (readUserData) {\n\
              var xxx = readUserData;\n\
              readUserData = [].concat(readUserData);\n\
              xxx = readUserData;\n\
              readUserData.forEach(ud=>{\n\
                xxx = ud;\n\
                var name = ud.name;\n\
                var content = ud.content;\n\
                this.user[ud.name] = ud.content;\
              });\
            }\
          });\
        });\
      '
    },
    saveUserData: {
      body:'\
        var valsMap = this.auxUserFields.reduce((mp,f)=>{\n\
          mp[f] = this.user[f] || "";\n\
          return mp;\n\
        }, {});\n\
        this._writeUserData(this.user._id, valsMap, function(results) {\n\
          this._showNotification("User data updated.");\
        });\
      '
    },
    doUsersSearch: {
      body:'\
      this._usersSearch({phrase:this.usersSearchFilter}, function(users) {\
        this.usersSearchItems = users;\
      });\
      '
    }
  },
  computed: {
  },
  watch: {
  },
  filters: {
    date: {
      args: ["value"],
      body: "return value?this._moment(value).format('l'):'';"
    }
  },
  components: [],
  uiSchema: {
    component: 'container',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: '_lookupUser Example' },
        {component: 'cardText', contents: [
          {component: 'form', contents:[
            {component: "textField", vmodel:"user.email", props:{label:"Email"}, on:{blur:"onEmailBlur"}},
            {component: "textField", vmodel:"user.firstName", props:{readonly:true, label:"First Name"}},
            {component: "textField", vmodel:"user.lastName", props:{readonly:true, label:"Last Name"}},
            {component: "textField", vmodel:"user.phone", props:{label:"Phone"}},
            {component: "textField", vmodel:"user.streetAddress", props:{label:"StreetAddress"}},
            {component: "textField", vmodel:"user.city", props:{label:"City"}}
          ]}
        ]},
        {component: "cardActions", contents:[
          {component: "spacer"},
          {component: "button", props:{elevation:"2", color:"blue darken-1", text:true}, on:{"click.native":"saveUserData"}, contents: [
            {component: "icon", props:{left:true, dark:true}, contents:"mdi-content-save"},
            "Save"
          ]}
        ]}
      ]}, //card
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: [
          {component: "template", template:"<span>_usersSearch Example</span>"}, {component:"spacer"},
          {component: "textField", vmodel:"usersSearchFilter", props:{label:"SearchFilter", "persistent-hint":true, hint:"Enter a few letters or email or name.",
            "append-outer-icon":"mdi-magnify"}, on:{"click:append-outer":"doUsersSearch"}}
        ]},
        {component: 'cardText', contents: [
          {component: "dataTable", props:{":headers":"usersSearchHeaders", ":items":"usersSearchItems", "hide-default-footer":true, "disable-pagination":true},
            "class":"elevation-1", scopedSlots: {
            item: {component: "tr", contents:[
                {component: "template", template:"<td>{{ item.email }}</td>"},
                {component: "template", template:"<td>{{ item.firstName }}</td>"},
                {component: "template", template:"<td>{{ item.lastName }}</td>"}
            ]},
          }} //scopedSlots
        ]} //dataTable
      ]} //card
    ] //container
  }
};
export default uiConfig;
