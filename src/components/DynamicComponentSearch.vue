<template>
  <div>
      <v-dialog v-model="searchDialog" @keydown.esc.prevent="searchDialog = false" max-width="800px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>Dynamic Component Search</v-card-title>
        <v-card-text>
          <v-form ref="componentSearchForm">
            <v-text-field class="mb-3" v-model="componentSearchNameFilter" label="Name Filter" persistent-hint hint="Search for components with this phrase in the name."
              @input="onNameFilterChange"></v-text-field>
            <v-combobox v-model="componentSearchKeywords" :items="allComponentKeywords" label="Search by keyword" multiple chips @input="fetchComponents"></v-combobox>
            <v-data-table :items="components" :headers="componentHeaders" class="mt-2 elevation-1">
              <template v-slot:item="{ item }">
                <tr @click="select(item)">
                  <td><v-btn @click.stop="select(item)">Select</v-btn></td>
                  <td>{{ item.organizationName }}</td>
                  <td>{{ item.componentId }}</td>
                  <td><v-btn @click.stop="showDocumentation(item)">Show</v-btn></td>
                </tr>
              </template>
            </v-data-table>
          </v-form>
        </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="searchDialog=false">Cancel/Close</v-btn>
            <!--v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="fetchComponents">Search</v-btn-->
          </v-card-actions>
      </v-card>
    </v-dialog>
        <v-dialog v-model="documentationDialog" @keydown.esc.prevent="documentationDialog = false" max-width="900px" scrollable overlay-opacity="0.2">
      <v-card>
        <v-card-title>{{documentationItem.componentName}}</v-card-title>
        <v-card-text>
          <span v-html="documentationItem.documentation"></span>
        </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn elevation="2" color="blue darken-1" text @click.native="documentationDialog = false">Close</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>
import Api from '@/services/Api'
import { EventBus } from '../event-bus.js';
export default {
  props: {
    show: Boolean
  },
  data: () => ({
    searchDialog: false,
    componentSearchNameFilter: '',
    allComponentKeywords: [],
    componentSearchKeywords: [],
    components: [],
    documentationDialog: false,
    documentationItem: {},
    timeoutId: '',
    componentHeaders: [
      { text: "Insert", align:'left', sortable:false},
      { text: 'Organization', align: 'left', sortable: true, value: 'organizationName' },
      { text: 'Component', align: 'left', sortable: true, value: 'componentName' },
      { text: "Documentation", align:'left', sortable:false}
    ]
  }),
  watch: {
    show(show) {
      console.log('show='+show);
      if (show) {
        if (this.allComponentKeywords.length==0) {
          (async () => {
            var response = await Api().get('/organizationcomponent/getcomponentkeywords');
            if (response.data.success) {
              this.allComponentKeywords = response.data.keywords;
            } else if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            }
          })();
        }
        this.fetchComponents();
        this.searchDialog = true;
      } else {
//        this.searchDialog = false;
      }
    }
  },
  mounted() {
    this.componentSearchNameFilter = '';
    this.allComponentKeywords = [];
    this.componentSearchKeywords = [],
    this.components = [];
  },
  methods: {
      select(item) {
        this.$emit('onSelect', item);
        this.$nextTick(()=>{
          this.searchDialog = false;
        })
      },
      onNameFilterChange() {
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
          this.fetchComponents();
        }, 500);
      },
      fetchComponents() { //keep
        (async () => {
          var response = await Api().post('/organizationcomponent/searchcomponents',
            {keywordsFilter: this.componentSearchKeywords, nameFilter: this.componentSearchNameFilter});
          if (response.data.success) {
            this.components = response.data.components;
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg );
          }
        })();
      },
      showDocumentation(item) {
        this.documentationItem = item;
        this.documentationDialog = true;
      },
  }
}
</script>