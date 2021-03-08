<template>
<v-container fluid >
  <v-card>
    <v-card-title>
      <span class="text-h5">CloudHaven Form</span>
    </v-card-title>

    <v-card-text>
      <div ref="formDiv">
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click.native="cancel">Cancel</v-btn>
      <v-spacer></v-spacer>
      <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
    </v-card-actions>
  </v-card> 
</v-container>
</template>

<script>
import { addComponent } from '../services/BuildUI.js'
function getSchema() {
        function validateField1( v ) {
          if (!v) return true;
          if (v.indexOf('1')<0) {
            return true;
          } else {
            return `Error - contains a '1'`;
          }
        } 
        function field1Changed( v, form) {
          form['textField2'] = 'from field 1 changed';
        }
        function validateField2( v ) {
          if (!v) return true;
          if (v.indexOf('2')<0) {
            return true;
          } else {
            return `Error - contains a '2'`;
          }
        } 
        function validateField3( v ) {
          if (!v) return true;
          if (v.indexOf('3')<0) {
            return true;
          } else {
            return `Error - contains a '3'`;
          }
        }
        function formInit( form ) {
          form['textField1'] = 'aaa';
          form['textField2'] = 'bbb';
          form['textField3'] = 'ccc';
        }
        function formSubmit( form ) {
          if (!form['textField1'] && !form['textField2']) {
            return "Please enter a value in Text Field 1 or Text Field 2";
          }
          return true;
        }
        var schema = {
          form: {
            id: 'theForm',
            element: 'form',
            formInit: formInit,
            fields: [
              {
                id: "textField1",
                element: "text-field",
                label: "Text Field 1",
                validateField: validateField1,
                fieldChanged: field1Changed
              },
              {
                id: "textField2",
                element: "text-field",
                label: "Text Field 2",
                validateField:validateField2
              },
              {
                id: "textField3",
                element: "text-field",
                label: "Text Field 3",
                validateField: validateField3
              }
            ],
            tabs: [
              {
                
              }
            ]
            formSubmit: formSubmit
          }
        };
        return schema;
/*          validateField1: validateField1,
          validateField2: validateField2,
          validateField3: validateField3*/
      }

export default {
  components: {
  },
  data() {
    return {
      metaData: {}
    }
  },
    computed: {
    },
    created() {
    },
    mounted() {
      this.metaData = getSchema();
      var parentEl = this.$refs.formDiv;
      addComponent( parentEl, this.metaData.form );
    },
    watch: {
    },

    methods: {
    }
    
}
</script>
<style>
</style>