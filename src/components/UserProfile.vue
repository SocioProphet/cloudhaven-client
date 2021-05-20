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
import moment from 'moment'
import { mapState } from 'vuex'
import UserDataDictionary from './userdatadictionary.js'

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
      userData: UserDataDictionary.reduce((o,e)=>{o[e.id] = ''; return o;},{})
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
      this.$store.commit('SET_RESULTNOTIFICATION', '');
      var u = this.user;
      (async () => {
        var response = await Api().post('/userdata/batchget', {userIds: [this.user._id]});
        var userDataMap = response.data || {};
        var userDataList = userDataMap[this.user._id];
        if (userDataList) {
          userDataList.forEach(e=>{
            this.userData[e.name] = e.content;
          })
        }
      })();
    },
    beforeCreate() {
//      this.$nextTick(this.$refs.firstField.focus)
    },
    created() {
      this.$store.commit('SET_RESULTNOTIFICATION', '');
    },
    methods: {
      save () {
        this.valid = this.$refs.form.validate();
        if (!this.valid) return;
        var updates = Object.keys(this.userData).map(p=>({name:p, content:this.userData[p]}));
        (async () => {
          var response = await Api().post("/userdata/batchupsert", {userId: this.user._id, updates: updates});
          var result = response.data;
        })();
      },
      cancelForm() {
        router.go(-1)
      }
    }
  }
</script>
