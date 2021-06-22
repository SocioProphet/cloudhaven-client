export default `var uiConfig = {
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
    auxUserFields: ["phone", "streetAddress", "city"],
    testDate: new Date(),
    userFilesHeaders: [
      { text: 'Actions', align: 'left' },
      { text: 'Name', align: 'left', sortable: true, value: 'name' },
      { text: 'File Name', align: 'left', sortable: true, value: 'fileName' },
      { text: 'File Type', align: 'left', sortable: true, value: 'mimeType' },
      { text: 'File Size', align: 'left', sortable: true, value: 'fileSize' }
    ],
    userFiles: [],
    fileDlg: false,
    uploadedFile: null,
    userFile: {
      name: '',
      fileName: '',
      mimeType: '',
      file: null
    },
    userFileSrc: null,
    userFileName:'',
    userFormValid:true,
    fileBlob: null,
    displayImage: false

  },
  methods: {
    mounted: {
      args:[],
      body: 'this.fileDlg=false;'
    },
    required: {
      args: ["v"],
      body: 'return !!v || "Required."'
    },
    showFile: {
      args:["item"],
      body:'\
        this.userFile.mimeType = item.mimeType;\
        this.userFile.fileName = item.fileName;\
        this._getUserFile( {userId:this._currentUser._id, fileId:item._id}, function( fileObj ) {\
          this.fileBlob = fileObj;\
          this.displayImage = true;\
        });\
      '
    },      
    deleteFile: {
      args:["item"],
      body:'\
        this._userFileOperation({operation:"delete", userId:this._currentUser._id, fileId:item._id}, function(result) {\
          console.log("File delete result: "+result);\
          this.loadFiles();\
        });\
      '
    },
    onUserFileChange: {
      args: ["file"],
      body: '\
        this.userFile.fileName = file.name;\
        this.userFile.mimeType = file.type;\
        this.userFile.file = file;\
      '
    },
    saveFile: {
    body:'\
        var params = {\
          userId: this.cloudHavenUserId,\
          operation:"add",\
          name: this.userFile.name || "Not Specified",\
          fileName: this.userFile.fileName,\
          fileType: this.userFile.mimeType\
        };\
        params.file = this.userFile.file;\
        this._userFileOperation( params, (results) => {\
          this.fileDlg = false;\
          this.loadFiles();\
        });'
    },
    onUserFilesTabActive: {
      args:[],
      body:'this.loadFiles();'
    },
    loadFiles: {
      args:[],
      body:'this._getUserFiles(this._currentUser._id, function( files ) {\
        this.userFiles = (files||[]).map(f=>(Object.assign({fileSize:0},f)));\
      });'
    },
    onInput:{
      args:["v"],
      body:'alert(v);'
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
      {component: "h1", contents: "Examples"},
      {component: "tabs", props:{dark:true, "fixed-tabs":true, "background-color":"#1E5AC8",color:"#FFF10E"}, contents:[
        {component: "tab", contents:"_lookupUser"},
        {component: "tab", contents:"_usersSearch"},
        {component: "tab", contents:"Component"},
        {component: "tab", on:{change:"onUserFilesTabActive"}, contents:"User Files"},
        {component: "tabItem", contents:[
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
            ]},
        {component: "tabItem", contents:[
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
          ]}, //card
        ]},
        {component: "tabItem", contents:[
          {component: 'card', props: { elevation: 2 }, contents: [
            {component: 'cardTitle', contents: "Date Input Component"},
            {component: 'cardText', contents: [
              {component: "form", contents:[
                {component: 'dynamicComponent', organizationId:'cloudhaven', componentId: 'ch-date-field', vmodel:"testDate"},
                {component: 'template', template:"<span>Entered date: {{testDate | date}}</span>"}
              ]}
            ]} //dataTable
          ]} //card
        ]},// tabItem
        {component: "tabItem", contents:[
          {component: 'card', props: { elevation: 2 }, contents: [
            {component: 'cardTitle', contents: [
              {component: "row", contents: [
                "User Files", {component: "spacer"}, {component: "button", on:{click:"fileDlg = true"}, contents:"Upload File"}
              ]}
            ]},
            {component: 'cardText', contents: [
              {component: "dataTable", props:{":headers":"userFilesHeaders", ":items":"userFiles"}, scopedSlots:{
                item: {component: "tr", contents: [
                  {component: "td", contents:[
                    {component: "button", props:{icon:true}, contents:[
                      {component: "icon", props:{medium:true}, on:{"click.stop":"showFile(item)"}, contents:"mdi-eye-outline"}
                    ]},
                    {component: "button", props:{icon:true}, contents:[
                      {component: "icon", props:{medium:true}, on:{"click.stop":"deleteFile(item)"}, contents:"mdi-trash-can"}
                    ]}
                  ]},
                  {component: "template", template:"<td>{{ item.name }}</td>"},
                  {component: "template", template:"<td>{{ item.fileName }}</td>"},
                  {component: "template", template:"<td>{{ item.mimeType }}</td>"},
                  {component: "template", template:"<td>TBD</td>"}
                ]}
              }}
            ]} //cardText
          ]}, //card
          {component:"fileViewer", show:"displayImage", 
            props:{label:"Show File", ":mimeType":'userFile.mimeType', ':filename':"userFile.fileName", ":dataBlob":"fileBlob"}},
          {component: "dialog", props:{":value":"fileDlg", width:"600px"}, contents:[
            {component: "card", contents: [
              {component: "cardTitle", contents:"User File Upload Form"},
              {component: "cardText", contents: [
                {component: "form", ref:"userFileForm", vmodel:"userFormValid", props:{"lazy-validation":true}, contents:[
                  {component: "textField", props:{label:"Name", ":rules":"[required]"}, vmodel:"userFile.name"},
                  {component: "textField", props:{label:"File Name", readonly:true, ":value":"userFile.fileName"}},
                  {component: "textField", props:{label:"Mime Type", readonly:true, ":value":"userFile.mimeType"}},
                  {component: "fileInput", vmodel:"uploadedFile", props:{accept:"image/*", label:"User File Input", "persistent-hint":true,
                    hint:"this example only accepts .gif, .jpg, .jpeg, or .png images"}, on:{change:"onUserFileChange"}}
                ]} //form
              ]}, //cardText
              {component: "cardActions", contents: [
                {component: "spacer"},
                {component: "button", props:{elevation:"2",color:"blue darken-1", text:true}, on:{"click.native":"saveFile"}, contents:"Save"}
              ]}
            ]} //card
          ]}, //dialog
        ]}// tabItem
      ]}
    
    ] //container
  }
};
uiConfig;
`