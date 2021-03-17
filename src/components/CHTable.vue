<template>
  <v-data-table
    :headers="headers"
    :items="items"
    class="elevation-1"
  >
    <template  v-slot:item="{ item }">
      <component :is="'DynamicSlotComponent'" :uiSchema="uiSchema" :scopedProps="item"></component>
    </template>
  </v-data-table>
</template>

<script>
import DynamicSlotComponent from './DynamicSlotComponent.js'

export default {
  components: {
    DynamicSlotComponent
  },
  props: {
    uiSchema: { type: Object, required: true },
    headers: {type:Array, required: true},
    items: Array
  },
  data() {
    return {
      compName: 'DynamicSlotComponent'
    }
  },
  mounted() {
  }
}
</script>
