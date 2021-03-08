<template>
        <v-form ref="theForm" v-model="valid" lazy-validation>
      </v-form>

</template>
<script>
import { EventBus } from '../event-bus.js';
import CHTextField from "./CHTextField";
import { addComponent } from '../services/BuildUI.js'
export default {
  components: {
    CHTextField
  },
  props: {
    metaData: Object
  },
  data() {
    return {
      valid: true,
      formStore:{}
    }
  },
  created() {
    EventBus.$on('theForm-updateFields', (updatedFields)=> {
      this.updateFields(updatedFields);
    })
  },
  mounted() {
    var parentEl = this.$refs.theForm.$el;
    this.metaData.fields.forEach((fldMetaData)=>{
      addComponent( parentEl, fldMetaData, 'theForm' );
    })

    if (this.metaData.formInit) {
      var origStore = Object.assign({},this.formStore);
      (this.metaData.formInit)(this.formStore);
      var updatedFields = this.getUpdatedFields( origStore, this.formStore );
      this.updateFields( updatedFields );
    }
  },
  methods: {
    getUpdatedFields( origStore, modifiedStore ) {
      var updatedFields = {};
      Object.keys(modifiedStore).forEach((k)=>{
        if (origStore[k] != modifiedStore[k]) {
          updatedFields[k] = modifiedStore[k];
        }
      })
      return updatedFields;
    },
    updateFields(updatedFields) {
      Object.keys(updatedFields).forEach((k)=>{
        this.formStore[k] = updatedFields[k];
        EventBus.$emit(k+'-updateField', updatedFields[k]);
      })
    },
    cancel() {
    },
    save() {
      var isValid = this.$refs.theForm.validate();
      if (!isValid) {
        EventBus.$emit('global error alert', 'Please fix the errors before submitting.');
        return false;
      }
      if (this.metaData.formSubmit) {
        var origStore = Object.assign({},this.formStore);
        var result = (this.metaData.formSubmit)(this.formStore);
        if (result === true || result === false) {
          return result;
        }
        var updatedFields = this.getUpdatedFields( origStore, this.formStore );
        if (Object.keys(updatedFields).length>0) {
          this.updateFields( updatedFields );
        }
        EventBus.$emit('global error alert', result);
      }
    }
  }

};
</script>
