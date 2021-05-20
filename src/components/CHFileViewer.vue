
<template>
<div>
  <v-textarea v-if="docType=='text'" :label="label" :value="dataString" :rows="numTextRows" ></v-textarea>
  <pdf v-if="docType=='pdf'" :src="objectURL"></pdf>
  <div v-else-if="docType=='image'" >
  <v-zoomer  :style="{width: width, height: '600px', border: 'solid 1px silver'}">
  <v-img  :src="objectURL"></v-img>
  </v-zoomer>
    <v-row class="my-4" justify="space-around">Use mouse/touch to zoom and scroll.</v-row>
  </div>
  <div v-else-if="docType=='docx'" v-html="dataString">
  </div>
</div>
</template>
<script>

import pdf from 'vue-pdf';

export default {
  components: {
    pdf
  },
  props: {
    mimeType: {type: String, required: true},
    filename: {type: String},
    dataString: String,
    dataBlob: undefined,
    label: {type: String},
    width: {type: String, default: '1000px'}
  },
  data() {
    return {
      textValue:'',
      curDate:'',
      objectURL:null
    }
  },
  computed: {
    docType() {
      if (this.mimeType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'docx';
      } else if (this.mimeType == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        return "pptx";
      } else if (this.mimeType == 'application/pdf') {
        return 'pdf';
      } else if (this.mimeType.indexOf('image/')==0) {
        return 'image';
      } else if (this.mimeType == 'text/plain') {
        return 'text';
      }
    },
    numTextRows() {
      if (!this.dataString) return 0;
      var rows = this.dataString.split('\n').length;
      return rows>20?20:rows;
    }
  },
  created() {
    if (this.docType=='pdf' || this.docType=='image') {
      this.objectURL = URL.createObjectURL(this.dataBlob);
    }
  },
  methods: {
  }
}

</script>
