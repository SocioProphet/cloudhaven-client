<template>
  <div class="mt-3">
    <v-toolbar dense elevation="5">
    <v-toolbar-title class="mr-3">VCDN Editor</v-toolbar-title>
    <v-spacer></v-spacer>
    </v-toolbar>
    <VCDNEditor type="Application" @changed="onChange"/>
    <br/>
    <div>
      JSON:<br/><span v-html="jsonHtml"/>
    </div>

  </div>
</template>

<script>
import VCDNEditor from './VCDNEditor.vue'
  export default {
    components: {
      VCDNEditor
    },
    data: () => ({
      json:''
    }),
    computed: {
      jsonHtml() {
        return this.json.replace(/\n/g,"<br/>").replace(/ /g,"&nbsp;");
      }
    },
    methods: {
      onChange( val ) {
        this.json = val;
      }
    }
  }
</script>

