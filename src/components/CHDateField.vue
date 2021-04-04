
<template>
  <v-text-field
    :label="label"
    :value="dateToString(value)"
    @input="input"
    v-on="listeners"
    v-bind="$attrs"
    :rules=[dateRule]
  >
  </v-text-field>
</template>
<script>
import moment from 'moment'

export default {
  props: {
    value: Date,
    label: String
  },
  data() {
    return {
      curDate:''
    }
  },
  computed: {
    listeners() {
      const { input, ...listeners } = this.$listeners;
      return listeners;
    }
  },
  methods: {
    dateRule(value) {
      var parts = this.curDate.split(/[^\d]/)
      if (!parts || parts.length<3 || (parts[0].length<4 && parts[1].length<4 && parts[2].length<4)) return 'Enter a valid date format.';
      var isValid = moment(this.curDate, 'l').isValid();
      return (value && isValid) || 'Enter a valid date format.';
    },
    input(value) {
      if (!value) {
        this.$emit('input', null);
        return;
      }
      this.curDate = value;
      var parts = value.split(/[^\d]/)
      if (!parts || parts.length<3 || (parts[0].length<4 && parts[1].length<4 && parts[2].length<4)) return;
      var emitVal = moment(value, "L");
      if (emitVal.year()<1000) return;
      if (emitVal.isValid()) {
        this.$emit('input', emitVal.toDate())
      }
    },
    dateToString( value ) {
      var v = value?moment(value).format('l'):''
      this.curDate = v;
      return v;
    }
  }
}

</script>
