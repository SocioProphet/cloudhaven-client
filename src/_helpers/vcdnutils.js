import * as VueLib from 'vuetify/lib'
import CommentsManager from '../components/CommentsManager.vue'
import CHDateField from '../components/CHDateField.vue'
import CHFileViewer from '../components/CHFileViewer.vue'
import { TiptapVuetify, Heading, Bold, Italic, Strike, Underline, Code, Paragraph, BulletList, OrderedList, ListItem, Link, Blockquote, HardBreak, HorizontalRule, History } from 'tiptap-vuetify';
import _ from 'lodash';

function isObject( obj ) {
  return (((typeof obj)==='object') && !Array.isArray(obj));
}
var validHtmlTags = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 
  'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 
  'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 
  'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'MathML math', 'menu', 'meta', 'meter', 'nav', 'noscript', 
  'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 
  's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 
  'sup', 'SVG svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 
  'track', 'u', 'ul', 'var', 'video', 'wbr', 'autonomous custom elements'
]

var obj = {};
obj.validHtmlTags = validHtmlTags;
obj.clientFunctionMap = {
  _writeAppData:'this._writeAppData({table:"", key:"", dataString:""}, function(results) {});',
  _readAppData :'this._readAppData({table:"", key:"", searchOperator:"contains"}, function(data) {});',
  _pdfGet:'this._pdfGet({operationId:""}, function(data) {});',
  _appGet:'this._appGet({operationId:""}, function(data) {});',
  _appGetFile:'this._appGetFile({operationId:"", fileId:""}, function(blob) {});',
  _appPost:'this._appPost({operationId:"", postData:""}, function(results) {});',
  _lookupUser:'this._lookupUser({email:"", ssn:""}, function(user) {});',
  _usersSearch:'this._usersSearch({searchPhrase:"", dateOfBirth:""}, function(users) {});',
  _getUserData:'this._getUserData(userIds, userDataIds, function() {});',
  _writeUserData:'this._writeUserData(userId, userDataIdToValueMap, function(results) {});',
  _writeMultiInstanceUserData: 'this._writeMultiInstanceUserData({owner:"", organizationId:"", key:"", content:""}, function(result) {});',
  _getMultiInstanceUserData: 'this._getMultiInstanceUserData({owner:"", organizationId:"", key:""}, function(result) {});',
  _deleteMultiInstanceUserData: 'this._deleteMultiInstanceUserData({owner:"", _id:"", organizationId:"", key:""}, function(result) {});',
  _getUserFile:'this._getUserFile(userId, fileId, function(blob) {});',
  _userFileOperation:'_userFileOperation({operation:"", userId:"", fileType:"", name:"", fileName:"", fileId:"", file:null}, function(results) {});',
  _gotoAppPage:'this._gotoAppPage(page, appParams );',
  _sendMessage:'this._sendMessage({senderId:"", senderEmail:"", recipients:[{type:"to"(or "cc" or "bcc"),email:"john@widgetco.com"}], subject:"", message:"", application:{organizationId:"", applicationId:"", appConfigData:{}}}, function(queueItemId) {});',
  _queueTask: 'this._queueTask({groupId:"", subject:"", message:"", applicationId:""}, function(result) {});',
  _setTaskOutcome:'this._setTaskOutcome({taskId:"", resultStatus:"Completed", resultMessage:""}, function(results) {});',
  _deleteMessageOrTask:'this._deleteUserMessageOrTask({messageId:"" or taskId:""}, function(results) {});',
  _addCalendarEntry:'this._addCalendarEntry({ownerId:"", title:"", content:"", start:new Date(), end: new Date(), durationType:"timed", application:{organizationId:"", applicationId:"", appConfigData:{}}}, function(calEntryId ) {});',
  _showNotification:'this._showNotification("");',
  _showError:'this._showError("");',
  _currentUser: 'this._currentUser',
  _deepGet: 'this._deepGet(<obj>,<path>)',
  _deepSet: 'this._deepSet(<obj>,<path>,<value>)',
  _app: 'this._app',
  _moment: 'this.moment()'
  };
  
obj.uiElementToVueCompMap = {
  alert: VueLib['VAlert'],
  autocomplete: VueLib['VAutocomplete'],
  avatar: VueLib['VAvatar'],
  badge: VueLib['VBadge'],
  banner: VueLib['VBanner'],
  bottomNavigation: VueLib['VBottomNavigation'],
  bottomSheet: VueLib['VBottomSheet'],
  breadcrumbs: VueLib['VBreadcrumbs'],
  col: VueLib['VCol'],
  button: VueLib['VBtn'],
  buttonToggle: VueLib['VBtnToggle'],
  calendar: VueLib['VCalendar'],
  calendarDaily: VueLib['VCalendarDaily'],
  calendarMonthly: VueLib['VCalendarMonthly'],
  calendarWeekly: VueLib['VCalendarWeekly'],
  card: VueLib['VCard'],
  cardSubtitle: VueLib['VCardSubtitle'],
  cardTitle: VueLib['VCardTitle'],
  cardText: VueLib['VCardText'],
  cardActions: VueLib['VCardActions'],
  carousel: VueLib['VCarousel'],
  carouselItem: VueLib['VCarouselItem'],
  chip: VueLib['VChip'],
  chipGroup: VueLib['VChipGroup'],
  checkbox: VueLib['VCheckbox'],
  colorPicker: VueLib['VColorPicker'],
  combobox: VueLib['VCombobox'],
  container: VueLib['VContainer'],
  dataIterator: VueLib['VDataIterator'],
  dataFooter: VueLib['VDataFooter'],
  datePicker: VueLib['VDatePicker'],
  dataTable: VueLib['VDataTable'],
  dataTableHeader: VueLib['VDataTableHeader'],
  dialog: VueLib['VDialog'],
  divider: VueLib['VDivider'],
  expansionPanel: VueLib['VExpansionPanel'],
  expansionPanelHeader: VueLib['VExpansionPanelHeader'],
  expansionPanelContent: VueLib['VExpansionPanelContent'],
  expansionPanels: VueLib['VExpansionPanels'],
  editDialog: VueLib['VEditDialog'],
  fileInput: VueLib['VFileInput'],
  footer: VueLib['VFooter'],
  form: VueLib['VForm'],
  hover: VueLib['VHover'],
  icon: VueLib['VIcon'],
  image: VueLib['VImg'],
  vinput: VueLib['VInput'],
  item: VueLib['VItem'],
  itemGroup: VueLib['VItemGroup'],
  lazy: VueLib['VLazy'],
  list: VueLib['VList'],
  listGroup: VueLib['VListGroup'],
  listItem: VueLib['VListItem'],
  listItemAction: VueLib['VListItemAction'],
  listItemActionText: VueLib['VListItemActionText'],
  listItemAvatar: VueLib['VListItemAvatar'],
  listItemContent: VueLib['VListItemContent'],
  listItemGroup: VueLib['VListItemGroup'],
  listItemIcon: VueLib['VListItemIcon'],
  listItemSubtitle: VueLib['VListItemSubtitle'],
  listItemTitle: VueLib['VListItemTitle'],
  menu: VueLib['VMenu'],
  navigationDrawer: VueLib['VNavigationDrawer'],
  overflowButton: VueLib['VOverflowBtn'],
  overlay: VueLib['VOverlay'],
  pagination: VueLib['VPagination'],
  parallax: VueLib['VParallax'],
  progressCircular: VueLib['VProgressCircular'],
  progressLinear: VueLib['VProgressLinear'],
  overlay: VueLib['VOverlay'],
  overlay: VueLib['VOverlay'],
  radio: VueLib['VRadio'],
  rangeSlider: VueLib['VRangeSlider'],
  radioGroup: VueLib['VRadioGroup'],
  rating: VueLib['VRating'],
  responsive: VueLib['VResponsive'],
  richTextField: TiptapVuetify,
  row: VueLib['VRow'],
  select: VueLib['VSelect'],
  sheet: VueLib['VSheet'],
  simpleCheckbox: VueLib['VSimpleCheckbox'],
  simpleTable: VueLib['VSimpleTable'],
  skeletonLoader: VueLib['VSkeletonLoader'],
  slider: VueLib['VSlider'],
  slideGroup: VueLib['VSlideGroup'],
  slideItem: VueLib['VSlideItem'],
  snackbar: VueLib['VSnackbar'],
  spacer: VueLib['VSpacer'],
  sparkline: VueLib['VSparkline'],
  stepper: VueLib['VStepper'],
  stepperContent: VueLib['VStepperContent'],
  stepperHeader: VueLib['VStepperHeader'],
  stepperItems: VueLib['VStepperItems'],
  stepperStep: VueLib['VStepperStep'],
  subheader: VueLib['VSubheader'],
  switch: VueLib['VSwitch'],
  tab: VueLib['VTab'],
  tabs: VueLib['VTabs'],
  tabsItems: VueLib['VTabsItems'],
  tabItem: VueLib['VTabItem'],
  tabsSlider: VueLib['VTabsSlider'],
  textarea: VueLib['VTextarea'],
  textField: VueLib['VTextField'],
  timePicker: VueLib['VTimePicker'],
  timeline: VueLib['VTimeline'],
  timelineItem: VueLib['VTimelineItem'],
  toolbar: VueLib['VToolbar'],
  toolbarTitle: VueLib['VToolbarTitle'],
  toolbarItems: VueLib['VToolbarItems'],
  tooltip: VueLib['VTooltip'],
  treeview: VueLib['VTreeview'],
  virtualScroll: VueLib['VVirtualScroll'],
  window: VueLib['VWindow'],
  windowItem: VueLib['VWindowItem'],
  conversation: CommentsManager,
  dateField: CHDateField,
  fileViewer: CHFileViewer
}
obj.getTiptapExtensions = () => {
  return [
    History,
    Blockquote,
    Link,
    Underline,
    Strike,
    Italic,
    ListItem,
    BulletList,
    OrderedList,
    [Heading, {
      options: {
        levels: [1, 2, 3]
      }
    }],
    Bold,
    Code,
    HorizontalRule,
    Paragraph,
    HardBreak
  ];
}
var defaultPage = `var uiConfig = {
  dataModel:{
    displayString:''
  },
  methods: {
    mounted: {
      args:[],
      body: 'this.displayString = "CloudHaven skeleton application";'
    }
  },
  computed: {
    decoratedDisplayString: {
      args:[],
      body: "return '** '+this.displayString+' **';"
    }
  },
  watch: {
    displayString: {
      args: ["val"],
      body: "alert(val);"
    }
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
        {component: 'cardTitle', contents: 'This is the title' },
        {component: 'cardText', contents: [
            {component: 'sheet', props:{'min-width':'200px', 'min-height':'200px'}, class: 'mt-auto mb-auto ml-auto mr-auto',
              template: '<span>{{decoratedDisplayString}}</span>'}]}
        ]}
    ]
  }
};
`;
var defaultComponent = `var uiConfig = {
  props: {
    exampleString: {type: "String"},
    exampleBoolean: {type: "Boolean"},
    exampleArray: {type: "Array"},
    exampleObject: {type: "Object"}
  },
  dataModel:{
    displayString:''
  },
  methods: {
    mounted: {
      args:[],
      body: 'this.displayString = "CloudHaven skeleton component";'
    }
  },
  computed: {
    decoratedDisplayString: {
      args:[],
      body: "return '** '+this.displayString+' **';"
    }
  },
  watch: {
    displayString: {
      args: ["val"],
      body: "console.log(val);"
    }
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
    component: 'sheet',
    contents: [
      {component: 'card', props: { elevation: 2 }, contents: [
        {component: 'cardTitle', contents: 'This is the title' },
        {component: 'cardText', contents: [
            {component: 'sheet', props:{'min-width':'200px', 'min-height':'200px'}, class: 'mt-auto mb-auto ml-auto mr-auto',
              template: '<span>{{decoratedDisplayString}}</span>'}]}
        ]}
    ]
  }
};
`;

var defaultMixin = `var mixins = {
  dataModel:{
    someVar:''
  },
  methods: {
    someFunc: {
      args:["param1", "param2"],
      body: 'return "some return value";'
    }
  },
  computed: {
    someComputedVal: {
      body: "return this.someVar+'.';"
    }
  },
  watch: {
    someVar: {
      args: ["val"],
      body: "console.log(val);"
    }
  },
  filters: {
    date: {
      args: ["value"],
      body: "return value?this._moment(value).format('l'):'';"
    }
  }
};
`;

obj.getDefaultPage = () => {
  return defaultPage;
}

obj.getDefaultComponent = () => {
  return defaultComponent;
}

obj.getDefaultMixin = () => {
  return defaultMixin;
}

obj.sandboxedStringToJSON = ( src ) => {
  if (src.indexOf('var uiConfig')<0) {
    throw 'Missing "var uiConfig" declaration.';
  }
  var func = Function.apply( null, [src+'\nreturn uiConfig;\n'] );
  return (func)();
}

obj.sandboxedMixinStringToJSON = ( src ) => {
  if (src.indexOf('var mixins')<0) {
    throw 'Missing "var mixins" declaration.';
  }
  var func = Function.apply( null, [src+'\nreturn mixins;\n'] );
  return (func)();
}

obj.checkStructure = ( vcdn, structureType ) => {
  structureType = structureType || 'page';
  var errors = [];
  function makeFunction( funcType, funcSpec, name ) {
    try {
      if (_.isString(funcSpec)) {
        return Function.apply( null, [funcSpec]);
      } else {
        var getSetObj = null;
        if (funcSpec.set) {
          getSetObj = getSetObj || {};
          getSetObj.set = makeFunction( funcType, funcSpec.set, name+':set' );
        }
        if (funcSpec.get) {
          getSetObj = getSetObj || {};
          getSetObj.get = makeFunction( funcType, funcSpec.get, name+':get' );
        }
        if (getSetObj) return getSetObj;
        var args = [].concat(funcSpec.args || []);
        args.push(funcSpec.body);
        var func = Function.apply( null, args);
        if (_.isString(func)) {
          throw func;
        }
        return func;
      }
    } catch (e) {
      errors.push(`${funcType} - ${name} error: ${e}`);
    }
  }
  function validateMethods( funcType, methodsJSON ) {
    Object.keys(methodsJSON).forEach(methodName=>{
      var methodObj = methodsJSON[methodName];
      var methodErrors = [];
      if (isObject(methodObj)) {
        var validProps = {args:true, body:true};
        Object.keys(methodObj).forEach(prop =>{
          if (!validProps[prop]) {
            methodErrors.push(`Invalid ${funcType} property "${prop}" - (args and/or body required)`);
            if (prop == 'args') {
              if (!Array.isArray(methodObj[prop])) {
                methodErrors.push(`${funcType} ${methodName} property ${prop} type is invalid (must be array).`);
              } else {
                for (var i=0;i<methodObj[prop].length;i++) {
                  var el = methodObj[prop][i];
                  if (!_.isString(el)) {
                    methodErrors.push(`${funcType} ${methodName} argument ${i} type is invalid (must be string).`);
                  }
                }
              }
            } else if (prop == 'body' && !_.isString(methodObj[prop])) {
              methodErrors.push(`${funcType} ${methodName} body type is invalid (must be string).`);
            }
          }
        })
      } else if (!_.isString(methodObj)) {
        methodErrors.push(`${funcType} ${methodName} type is invalid (must be string or JSON object)`);
      }
      if (methodErrors.length==0) {
        makeFunction(funcType, methodObj, methodName);
      }
      errors = errors.concat(methodErrors);
    })
  }
  function validateComponents( componentsJSON ) {
    if (!Array.isArray(componentsJSON)) {
      errors.push('"components" root property invalid (must be an array of JSON objects).')
    } else {
      for (var i=0;i<componentsJSON.length;i++) {
        if (!isObject(componentsJSON[i])) {
          errors.push(`Component at index $[i] is invalid (must be a JSON object).`);
        }
      }
    }
  }
/*  function validateExtComponents( extCompJSON ) {
    if (!Array.isArray(extCompJSON)) {
      errors.push('"externalComponents" root property invalid (must be an array of JSON objects).')
    } else {
      for (var i=0;i<extCompJSON.length;i++) {
        var extCompObj = extCompJSON[i];
        if (!isObject(extCompObj)) {
          errors.push(`External component at index $[i] is invalid (must be a JSON object).`);
        } else {
          var validExtCompProps = {organizationId:true, componentId:true};
          Object.keys(extCompObj).forEach(extCompProp =>{
            if (!validExtCompProps[extCompProp]) {
              errors.push(`External component (index ${i}) property ${extCompProp} is not recognized (must be organizationId or componentId)`);
            }
            if (!_.isString(extCompObj[extCompProp])) {
              errors.push(`External component (index ${i}) property ${extCompProp} type is invalid (must be a string).`);
            }
            if (!extCompObj['organizationId'] || !extCompObj['componentId']) {
              errors.push(`External component (index ${i}) missing a required property (both organizationId and componentId required)`);
            }
          })
        }
      }
    }
  }*/
  function validateAppFrame( appFrameJSON ) {
    var validProps = {name:'string', appBarStyle: 'object', appBarTextClass: 'string', nameTextClass: 'string', menuItems: 'array'};
    Object.keys(appFrameJSON).forEach(prop => {
      var reqType = validProps[prop];
      if (!reqType) {
        errors.push(`Unrecognized appFrame property ${prop}.`)
      } else if ((reqType=='string' && !_.isString(appFrameJSON[prop])) ||
                 (reqType=='object' && !isObject(appFrameJSON[prop])) ||
                 (reqType=='string' && !_.isString(appFrameJSON[prop]))) {
                  errors.push(`appFrame property ${prop} type is invalid (${reqType} required).`)
      }

    })
  }
  function validateUISchema( uiSchema ) {
    if (_.isString(uiSchema)) return;
    if (!uiSchema.component) {
      errors.push(`Missing component property (near ${JSON.stringify(uiSchema).substring(0,60)}).`);
    }
    var validComponents = Object.keys(obj.uiElementToVueCompMap).concat(["template", "dynamicComponent", "loop"].concat(validHtmlTags))
      .sort((a,b)=>(a<b?-1:(a>b?1:0)));
    var defaultValidProps = [
      'component',
      'class',
      'style',
      'attrs',
      'props',
      'domProps',
      'key',
      'ref',
      ':class',
      ':style',
      ':attrs',
      ':props',
      ':domProps',
      ':key',
      ':ref',
      'to',
      'nativeOn',
      'on',
      'vmodel',
      'scopedSlots',
      'contents',
      'omit',
      'show',
      'scopedSlots',
      'template',
      'debug',
      'mask',
      'inheritListeners',
      'inheritAttrs'
    ];
    var compToValidProps = {
      dynamicComponent: ["organizationId", "componentId"].concat(defaultValidProps),
      loop: ["component", "dataList", "contents", "itemAlias", "indexIsKey", "key"],
      template: ["component", "template"]
    }
    var validProps = compToValidProps[uiSchema.component] || defaultValidProps;
    var validPropsMap = validProps.reduce((mp,p)=>{ mp[p] = true; return mp; },{});
    Object.keys(uiSchema).forEach(prop =>{
      if (!validPropsMap[prop]) {
        errors.push(`Component "${uiSchema.component}": unrecognized uiSchema property ${prop} (${validProps.join(', ')})`);
      }
      if (prop == 'component') {
        if (validComponents.indexOf(uiSchema.component)<0) {
          errors.push(`Unrecognized uiSchema component "${uiSchema.component}" (${validComponents.join(', ')})`);
        }
      }
    });
    if (uiSchema.contents) {
      if (Array.isArray(uiSchema.contents)) {
        uiSchema.contents.forEach(c=>{
          validateUISchema(c);
        })
      } else if (isObject(uiSchema.contents)) {
        validateUISchema(uiSchema.contents);
      }
    }
  }
  var validPropertiesMaps = {
    page: {
      components:'array',
      dataModel:'object',
      methods:'object',
      computed:'object',
      mixins:'array',
      filters:'object',
      watch:'object',
      appFrame:'object',
      uiSchema:'object'
    },
    component: {
      props: 'object',
      components:'array',
      dataModel:'object',
      methods:'object',
      computed:'object',
      mixins:'array',
      filters:'object',
      watch:'object',
      uiSchema:'object'
    },
    mixin: {
      dataModel:'object',
      methods:'object',
      computed:'object',
      filters:'object',
      watch:'object'
    }
  };
  Object.keys(vcdn).forEach(p=>{
    var obj = vcdn[p];
    var validPropertiesMap = validPropertiesMaps[structureType]||{};
    var objType = validPropertiesMap[p];
    if (!objType) {
      errors.push(`Invalid root property "${p}" - (${Object.keys(validPropertiesMap).join(', ')})`);
    }
    if ((objType=='array') && !Array.isArray(obj)) {
      errors.push(`Root property ${p} type is invalid (Array expected).`);
    }
    if ((objType=='object') && !isObject(obj)) {
      errors.push(`Root property ${p} type is invalid (Object expected).`);
    }
    if (p == 'components') {
      validateComponents( obj );
//    } else if (p == 'externalComponents') {
//      validateExtComponents( obj );
    } else if (p == 'methods') {
      validateMethods('method',obj);
    } else if (p == 'computed') {
      validateMethods(p,obj);
    } else if (p == 'filters') {
      validateMethods(p,obj);
    } else if (p == 'watch') {
      validateMethods(p,obj);
    } else if (p == 'appFrame') {
      validateAppFrame(obj);
    } else if (p == 'uiSchema') {
      validateUISchema(obj);
    }
})

  return errors.length==0?null:errors;
}

export default obj;
