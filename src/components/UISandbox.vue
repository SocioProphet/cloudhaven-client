<template>
  <DynamicUI :uiSchema="metaData" :dataModel="dataModel" :uiMethods="uiMethods"/>
</template>

<script>
import DynamicUI from './DynamicUI.js'

export default {
  components: {
    DynamicUI
  },
  data() {
    var dataModel = {
        cardTitle: 'Card Title...',
        headers: [
          { text: 'First Name', value:'firstName', sortable: true },
          { text: 'Last Name', value:'lastName', sortable: true },
          { text: 'Address', value:'address', sortable: true }
        ],
        items: [
          {firstName:'Big', lastName: 'Bork', address: '1234 Bork Street, Bob City, CA 99999'},

        ]
      };
      var uiMethods = {
        getTableData() {
          debugger;
          var xxx = this.items;
          this.items = [
            {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
            {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
            {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
          ];
        }
      }

    return {
      dataModel:dataModel,
      uiMethods: uiMethods,
      metaData: {
        component: 'container',
        contents: [
          {
            component: 'card',
            props: {
              elevation: 2
            },
            contents: [{
              component: 'cardTitle',
//              contents: 'This is the title'
              template: '<span>{{cardTitle}}</span>'
            },
            {
              component: 'cardBody',
              contents: [
                {
                  component: 'form',
                  props: {
                    'lazy-validation': true
                  },
                  contents: [
                    {
                      component: 'row',
                      contents: [
                        {
                          component: 'col',
                          props: {  cols:"12", md:"6", sm:"12"},
                          contents: [
                            {
                              component: 'textField',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 1'
                              }},
                              {
                              component: 'textField',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 2'
                              }}
                          ]
                        },
                        {
                          component: 'col',
                          props: { cols:"12", md:"6", sm:"12"},
                          contents: [
                            {
                              component: 'textField',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 3'
                              }},
                              {
                              component: 'textField',
                              props: {
                                dense: true,
                                outlined: false,
                                label: 'Field 4'
                              }}
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              component: 'cardActions',
              contents: [{
                component: 'button',
                contents: 'Cancel'
              },
              {
                component: 'spacer'
              },
              {
                component: 'button',
                contents: 'Save'
              }
              ]
            }]
          },
          {
            component: 'dataTable',
            dataModelProps: {
              headers: "headers",
              items: "items"
            }
          }
        ]
      }
    }
  },
    computed: {
    },
    created() {
    },
    mounted() {
      var parentEl = this.$refs.formDiv;
//      var sheetInst = new VSheet({propsData: {width:"100px", height:"100px", color:"#E0E0E0"}})
//      var btnInst = new VBtn({propsData: {color:'FF0000'}});
//      var btnVNode = h(btnInst)
  //    sheetInst.$slots.default = [btnVNode];

//      btnInst.$mount();
//      sheetInst.$mount();
//      parentEl.appendChild(sheetInst.$el);
    },
    watch: {
    },

    methods: {
    }
    
}
</script>
<style>
</style>