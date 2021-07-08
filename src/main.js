//import '@babel/polyfill'
import Vue from 'vue'
import App from './App.vue'
import vuetify from '@/plugins/vuetify'
import { TiptapVuetifyPlugin } from 'tiptap-vuetify'
// don't forget to import CSS styles
import 'tiptap-vuetify/dist/main.css'
import 'vuetify/dist/vuetify.min.css'
import router from './router'
import store from './store'
import './registerServiceWorker'
import moment from 'moment'
//import VueDragDrop from 'vue-drag-drop';
import Axios from 'axios'
import { VueMaskDirective } from 'v-mask'

import VueZoomer from 'vue-zoomer'
Vue.use(VueZoomer);


//import JsonCSV from 'vue-json-csv'
 
//Vue.component('downloadCsv', JsonCSV)

Vue.prototype.$http = Axios;
const token = localStorage.getItem('token')
if (token) {
  Vue.prototype.$http.defaults.headers.common['Authorization'] = token
}

//Vue.use(VueDragDrop);
Vue.directive('mask', VueMaskDirective );


Vue.config.productionTip = false;
/*Vue.filter('yesno', function (value) {
  return value ? 'Yes' : 'No';
});*/
Vue.filter('date', function(value){
  return value?moment(value).format('l'):'';
});
Vue.filter('datetime', function(value){
  return value?moment(value).format('l LT'):'';
});
Vue.filter('formattedNumber', function(value, decimalPlaces=2 ){
  var val = value;
  var d= decimalPlaces;
  if (value == undefined || value===null || value==='') return '';
  var val = value.toLocaleString(undefined, {minimumFractionDigits: decimalPlaces||0, maximumFractionDigits: decimalPlaces||0});
  return val;
});
Vue.filter('formattedPhone', function(value) {
  if (!value) return '';
  var rawPhone = value.replace(/[( )-.]/g, '');
  if (rawPhone.length==10) {
    return `(${rawPhone.substring(0,3)}) ${rawPhone.substring(3,6)}-${rawPhone.substring(6)}`;
  } else if (rawPhone.length==7) {
    return `${rawPhone.substring(0,3)}-${rawPhone.substring(3)}`;
  } else {
    return rawPhone;
  }
});
/*Vue.filter('formattedSSN', function(value) {
  if (!value) return '';
  if (value.length!=9) return value;
  return `${value.substring(0,3)}-${value.substring(3,5)}-${value.substring(5)}`;
})*/
Vue.prototype.$ordinalSuffix = (i) => {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
};
Vue.prototype.$digitsToDate = function( digits ) {
  if (digits.length<10) return null;
  return moment(digits, 'MM/DD/YYYY').toDate();
}
Vue.filter('mimeType', (value)=>{
  return value=='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?'(docx)':value;
})

Vue.use(require('vue-moment'))
Vue.prototype.moment = moment;
Vue.prototype.$safeRef = (obj) => obj?obj:{}
Vue.use(TiptapVuetifyPlugin, {
  // the next line is important! You need to provide the Vuetify Object to this place.
  vuetify, // same as "vuetify: vuetify"
  // optional, default to 'md' (default vuetify icons before v2.0.0)
  iconsGroup: 'mdi'
});
new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app');
