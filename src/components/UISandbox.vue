<template>
  <DynamicUI :uiConfig="uiConfig" :app="app"/>
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

        ],
        formData: {
          firstName: '',
          lastName: '',
          fieldA: '',
          fieldB: ''
        }
      };
      var uiMethods = {
        initialize: {
          args:[],
          body: `
          this._getUserData(this.$store.state.user._id);
          this.items = [
            {firstName:'Bob', lastName: 'Smith', address: '1234 Bob Street, Bob City, CA 99999'},
            {firstName:'Dave', lastName: 'Anderson', address: '9999 Dave Street, Some City, CA 99999'},
            {firstName:'Xaviar', lastName: 'Gomez', address: '7777 Xav Street, Gomez City, CA 99999'}
          ];`
        }
      }

    return {
      uiConfig: {
        dataModel:dataModel,
        uiMethods: uiMethods,
        uiSchema: {
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
                            props: {  cols:12, md:6, sm:12},
                            contents: [
                              {
                                component: 'textField',
                                vmodel: "formData.firstName",
                                tokenId: "firstName",
                                props: {
                                  dense: true,
                                  outlined: false,
                                  label: 'First Name'
                                }},
                                {
                                component: 'textField',
                                vmodel: "formData.lastName",
                                tokenId: "lastName",
                                props: {
                                  dense: true,
                                  outlined: false,
                                  label: 'Last Name'
                                }}
                            ]
                          },
                          {
                            component: 'col',
                            props: { cols:12, md:6, sm:12},
                            contents: [
                              {
                                component: 'textField',
                                vmodel: "formData.fieldA",
                                props: {
                                  dense: true,
                                  outlined: false,
                                  label: 'Field A'
                                }},
                                {
                                component: 'textField',
                                vmodel: "formData.fieldB",
                                props: {
                                  dense: true,
                                  outlined: false,
                                  label: 'Field B'
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
              attrs: {
                headers: "this.headers",
                items: "this.items"
              }
            }
          ]
        }
      },
      app: {}
    }
  }    
}
</script>
<style>
</style>