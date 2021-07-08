<template>
<v-container>
  <v-card>
    <v-card-title>
      <span class="text-h5">My Profile</span>
    </v-card-title>

    <v-card-text>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-row>
          <v-col cols="12" md="6" sm="12">
            <div v-for="e in colDDs[0]" :key="e.id">
              <v-text-field v-if="e.fieldType=='email'" :readonly="e.fieldType=='email'" type="email" v-model="user.email" :label="e.label" :rules="[rules.email]"></v-text-field>
              <v-select v-else-if="e.fieldType=='state'" v-model="userData[e.id]" :items="stateOptions" item-value="abbreviation" item-text="name" :label="e.label"></v-select>
              <v-select v-else-if="e.options" v-model="userData[e.id]" :label="e.label" :items="e.options"></v-select>
              <v-text-field v-else :ref="e.id" v-model="userData[e.id]" :label="e.label" :rules="e.validation?[rules[e.validation]]:[]"></v-text-field>
            </div>
            <v-select :items="homePageOptions" class="mb-0 pb-0" v-model="homePage" label="Home Page" item-value="value" item-text="text"></v-select>
          </v-col>
          <v-col cols="12" md="6" sm="12">
            <div v-for="e in colDDs[1]" :key="e.id">
              <v-text-field v-if="e.fieldType=='email'" :readonly="e.fieldType=='email'" type="email" v-model="user.email" :label="e.label" :rules="[rules.email]"></v-text-field>
              <v-select v-else-if="e.fieldType=='state'" v-model="userData[e.id]" :items="stateOptions" item-value="abbreviation" item-text="name" :label="e.label"></v-select>
              <v-select v-else-if="e.options" v-model="userData[e.id]" :label="e.label" :items="e.options"></v-select>
              <v-text-field v-else :ref="e.id" v-model="userData[e.id]" :label="e.label" :rules="e.validation?[rules[e.validation]]:[]"></v-text-field>
            </div>
          </v-col>
        </v-row>

      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-btn elevation="2" color="blue darken-1" text @click.native="cancelForm">Cancel</v-btn>
      <v-spacer></v-spacer>
      <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
    </v-card-actions>

  </v-card>
</v-container>
</template>

<script>
import Api from '@/services/Api'
import router from '../router'
import stateList from '../_helpers/stateList.js'
import { EventBus } from '../event-bus.js';
import { mapState } from 'vuex'
import UserDataDictionary from './userdatadictionary.js'
import moment from 'moment';

  export default {
    data: () => ({
      valid: true,
      error: '',
      vm: this,
      rules: {
          required: value => !!value || 'Required.',
          requiredObject: value => (value && value._id!='') || 'Required.',
          ssn: (v) => !v || /^\d{3}-?\d{2}-?\d{4}$/.test(v) || 'Please enter a valid SSN.',
          nonNegative: value => value >= 0 || 'Enter non-negative number.',
          email: (v) => !v || /^[^@]+@[^.]+\..+$/.test(v) || 'Please enter a valid email.',
          phone: (v) => !v || /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/.test(v) || 'Please enter a valid phone number.'
      },
      formattedDateOfBirth: '',
      userData: UserDataDictionary.reduce((o,e)=>{o[e.id] = ''; return o;},{}),
      homePageOptions: [
        {value:'Welcome', text:'Welcome'},
        {value:'MyApps', text: 'My Apps'},
        {value:'AppStore', text:'App Store'},
        {value: 'organizations', text:'Develop'}
      ],
      homePage:'Welcome'

    }),
    computed: {
      colDDs() {
        var cols = [[],[]];
        var cnt = 0;
        var maxRows = Math.ceil(UserDataDictionary.length/2)
        UserDataDictionary.forEach(e=>{
          cols[cnt<maxRows?0:1].push(e);
          cnt++;
        })
        return cols;
      },
      stateOptions() {
        return stateList;
      },
      ...mapState(['payers', 'user'])
    },

    mounted () {
      (async () => {
        var dummy = await this.$store.dispatch('reloadUser');
        var response = await Api().post('/userdata/batchget', {userIds: [this.user._id]});
        if (response.data.success) {
          var userDataMap = response.data.userDataMap || {};
          var userDataList = userDataMap[this.user._id];
          if (userDataList) {
            userDataList.forEach(e=>{
              this.userData[e.name] = e.content;
            })
          }
          UserDataDictionary.forEach(de=>{
            if (de.coreData) {
              this.userData[de.id] = de.id=='dateOfBirth'? moment(this.user[de.id]).format('l'):this.user[de.id];
            }
          })
        }
        response = await Api().get('/userdata/getuser/'+this.user._id);
        if (response.data.success) {
          var user = response.data.user;
          var coreUserFields = ["email", "firstName", "middleName", "lastName", "dateOfBirth", "ssn", "language", "homePage"];
          coreUserFields.forEach(f=>{
            this.userData[f] = user[f];
          });
          this.homePage = user.homePage;
        }
      })();
    },
    beforeCreate() {
//      this.$nextTick(this.$refs.firstField.focus)
    },
    created() {
    },
    methods: {
      save () {
        this.valid = this.$refs.form.validate();
        if (!this.valid) return;
        var updates = [].concat(Object.keys(this.userData).map(p=>({name:p, content:this.userData[p]})));
        updates.push({name:'homePage', content:this.homePage});
        (async () => {
          var response = await Api().post("/userdata/batchupsert", {userId: this.user._id, updates: updates});
          if (response.data.success) {
            var dummy = await this.$store.dispatch('reloadUser');
            EventBus.$emit('global success alert', `User profile updated.`);
          } else if (response.data.errMsg) {
            EventBus.$emit('global error alert', response.data.errMsg || 'Update failed.');
          }
        })();
      },
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>
