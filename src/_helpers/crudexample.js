export default `var uiConfig = {
  dataModel:{
      dialog: false,
      dialogDelete: false,
      headers: [
        {
          text: 'Dessert (100g serving)',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        { text: 'Calories', value: 'calories' },
        { text: 'Fat (g)', value: 'fat' },
        { text: 'Carbs (g)', value: 'carbs' },
        { text: 'Protein (g)', value: 'protein' },
        { text: 'Actions', value: 'actions', sortable: false },
      ],
      desserts: [],
      editedIndex: -1,
      editedItem: {
        name: '',
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
      },
      defaultItem: {
        name: '',
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
      },
  },
  computed: {
    formTitle:"return this.editedIndex === -1 ? 'New Item' : 'Edit Item'"
  },
  watch: {
    dialog: {
      args: ["val"],
      body: "return val || this.close();"
    },
    dialogDelete: {
      args: ["val"],
      body: "return val || this.closeDelete();"
    },
  },
  methods: {
    created: "this.initialize();",
    initialize: {
      body: '\
      this._readAppData({table:"Desserts", key:this._currentUser.email }, function(result) {\
        if (result.success) {\
          this.desserts = JSON.parse(result.data[0].jsonData);\
        }\
      });',
    },
    editItem: {
      args: ["item"],
      body: '\
        this.editedIndex = this.desserts.indexOf(item);\
        this.editedItem = Object.assign({}, item);\
        this.dialog = true;'
    },
    deleteItem: {
      args: ["item"],
      body: '\
        this.editedIndex = this.desserts.indexOf(item);\
        this.editedItem = Object.assign({}, item);\
        this.dialogDelete = true;'
    },
    deleteItemConfirm: {
      body: '\
      var deletedName = this.editedItem.name;\
        this.desserts.splice(this.editedIndex, 1);\
        this._writeAppData({table:"Desserts", key:this._currentUser.email, dataString:JSON.stringify(this.desserts)}, function(results) {\
          this._showNotification("Dessert "+deletedName+" deleted.");\
        });\
        this.closeDelete();'
    },
    close: {
      body: '\
        this.dialog = false;\
        this.$nextTick(() => {\
          this.editedItem = Object.assign({}, this.defaultItem);\
          this.editedIndex = -1;\
        });'
    },
    closeDelete: {
      body: '\
        this.dialogDelete = false;\
        this.$nextTick(() => {\
          this.editedItem = Object.assign({}, this.defaultItem);\
          this.editedIndex = -1;\
        })'
    },
    save: {
      body: '\
        var action = "added";\
        if (this.editedIndex > -1) {\
          action = "updated";\
          Object.assign(this.desserts[this.editedIndex], this.editedItem);\
        } else {\
          this.desserts.push(this.editedItem);\
        }\
        this._writeAppData({table:"Desserts", key:this._currentUser.email, dataString:JSON.stringify(this.desserts)}, function(results) {\
        this._showNotification("Dessert "+this.editedItem.name+" "+action+".");\
        this.close();\
        });'
    }
  },
  filters: {
    date: {
      args: ["value"],
      body: "return value?this._moment(value).format('l'):'';"
    }
  },
  appFrame: {
    name: 'Sample Application',
    appBarStyle: {background: 'linear-gradient(rgb(40, 54, 102) 0%, rgb(37, 114, 210) 100%)'},
    appBarTextClass: 'yellow--text text--accent-2',
    nameTextClass: 'white--text',
    menuItems: [ //These are just examples and need to be replaced by real pages
      { page: 'home', title: 'CRUD Example'},
      { page: 'miscExamples', title: 'Misc Examples'}
    ]
  },
  uiSchema: {component: "container", contents:[
  {component: "div", class:"ma-4", template:"<a href='https://vuetifyjs.com/en/components/data-tables/#crud-actions' target='_blank'>(from Vuetify Data Tables CRUD Actions example)</a>"},
  {component: "dataTable", props:{":headers":"headers", ":items":"desserts", "sort-by":"calories"}, class:"elevation-1", scopedSlots:{
    top:
      {component: "toolbar", props:{flat:true}, contents: [
        {component: "toolbarTitle", contents:"My CRUD"},
        {component: "divider", class:"mx-4", props:{inset:true, vertical:true}},
        {component: "spacer"},
        {component: "dialog", vmodel:"dialog", props:{"max-width":"500px"}, scopedSlots: {
          activator: {component: "button", props:{color:"primary", dark:true}, class:"mb-2", ":attrs":"attrs", on:"on", contents:"New Item"},
        }, contents: [
            {component: "card", contents:[
              {component: "cardTitle", contents:{component:"span", class:"text-h5", template:"<span>{{formTitle }}</span>"}},
              {component: "cardText", contents: [
                {component: "container", contents: [
                  {component: "row", contents: [
                    {component: "col", props:{cols:"12", sm:"6", md:"4"}, contents: [
                      {component: "textField", vmodel:"editedItem.name", props:{label:"Dessert name"}}
                    ]},
                    {component: "col", props:{cols:"12", sm:"6", md:"4"}, contents: [
                      {component: "textField", vmodel:"editedItem.calories", props:{label:"Calories"}}
                    ]},
                    {component: "col", props:{cols:"12", sm:"6", md:"4"}, contents: [
                      {component: "textField", vmodel:"editedItem.fat", props:{label:"Fat (g)"}}
                    ]},
                    {component: "col", props:{cols:"12", sm:"6", md:"4"}, contents: [
                      {component: "textField", vmodel:"editedItem.carbs", props:{label:"Carbs (g)"}}
                    ]},
                    {component: "col", props:{cols:"12", sm:"6", md:"4"}, contents: [
                      {component: "textField", vmodel:"editedItem.protein", props:{label:"Protein (g)"}}
                    ]},
                  ]}
                ]}
              ]},
              {component: "cardActions", contents:[
                {component: "spacer"},
                {component: "button", props:{color:"blue darken-1", text:true}, on:{click:"close"}, contents:"Cancel"},
                {component: "button", props:{color:"blue darken-1", text:true}, on:{click:"save"}, contents:"Save"},
              ]}
            ]} //card
        ]}, //dialog
        {component: "dialog",  vmodel:"dialogDelete", props:{"max-width":"500px"}, contents: [
          {component: "card", contents: [
            {component: "cardTitle", class:"text-h5", contents:"Are you sure you want to delete this item?"},
            {component: "cardActions", contents:[
              {component: "spacer"},
              {component: "button", props:{color:"blue darken-1", text:true}, on:{click:"closeDelete"}, contents:"Cancel"},
              {component: "button", props:{color:"blue darken-1", text:true}, on:{click:"deleteItemConfirm"}, contents:"OK"},
              {component: "spacer"}
            ]}
          ]}
        ]} //dialog
      ]},
      "item.actions":[
        {component: "icon", props:{small:true}, class:"mr-2", on:{click:"editItem(item)"}, contents:"mdi-pencil"},
        {component: "icon", props:{small:true}, class:"mr-2", on:{click:"deleteItem(item)"}, contents:"mdi-delete"}
      ],
      "no-data":{component: "button", props:{color:"primary"}, on:{click:"initialize"}, contents:"Reset"}
  }}
]}
};`;
      