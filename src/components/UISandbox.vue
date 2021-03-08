<template>
  <DynamicUI :metaData="metaData"/>
</template>

<script>
import DynamicUI from './DynamicUI.js'

export default {
  components: {
    DynamicUI
  },
  data() {
    return {
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
              contents: 'This is the title'
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
            props: {
              headers: [
                { text: 'First Name', value:'firstName', sortable: true },
                { text: 'Last Name', value:'lastName', sortable: true },
                { text: 'Address', value:'address', sortable: true }
              ],
              items: [
                {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
                {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
                {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
              ]
            }
          }
        ]
      }
    }

/*
            <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>

*/
  /*      form: {
          id: 'theForm',
          element: 'form',
          fields: [
            {
              id: "textField1",
              element: "text-field",
              label: "Text Field 1"
            },
            {
              id: "textField2",
              element: "text-field",
              label: "Text Field 2"
            },
            {
              id: "textField3",
              element: "text-field",
              label: "Text Field 3"
            }
          ],
          tabs: [
            {
              
            }
          ]
        }*/
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