<template>
  <v-text-field
    v-bind="$attrs"
    :value="value"
    color="primary"
    v-on="$listeners"
    :label="metaData.label"
    @input="onInput"
    @blur="fieldChanged"
    :rules="rules"
    validate-on-blur
    class="CHTextField"
    style="text-align:left"
  />
</template>
<script>
import { EventBus } from '../event-bus.js';
export default {
  props: {
    metaData: Object,
    formId: String
  },
  inheritAttrs: false,
  data() {
    return {
      value: '',
      rules:[]
    }
  },
  created() {
    this.rules.push(this.metaData.validateField);
    EventBus.$on(this.metaData.id+'-updateField', (val) => {
      this.value = val;
    })
  },
  methods: {
    onInput(v) {
      this.value = v;
      this.$emit('input', v);
    },
    fieldChanged() {
      var updatedFields = {}
      updatedFields[this.metaData.id] = this.value;
      if (this.metaData.fieldChanged) {
        (this.metaData.fieldChanged)(this.value, updatedFields);
      }
      EventBus.$emit(this.formId+'-updateFields', updatedFields);
    }
  }
};
</script>

<style>
  .CHTextField label {
    right: auto !important;
  }
</style>