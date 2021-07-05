import Vue from 'vue'
import Vuex from 'vuex'
import CRUDApi from '@/services/CRUDRestService'
import { EventBus } from './event-bus.js';
import axios from 'axios'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    apiMap: {},
    users: [],
    organizations: [],
    currentRole:'',
    status: '',
    token: localStorage.getItem('token') || '',
    user: {rolesMap:{}, state:''},
    userSettings: {},
    routerParams: {}
  },
  getters: {
    isLoggedIn: state => !!state.token,
    authStatus: state => state.status,
    findById: (state) => (model, id) => {
      return state[model].find(obj => obj._id === id)
    },
    currentRole: (state) => (state.currentRole || (state.currentRole=localStorage.getItem('cloudHavenCurrentRole'))),
    getUserSetting: (state) => (setting) => {
      return state.userSettings[setting] || (state.userSettings[setting]=localStorage.getItem(setting));
    }
  },
  actions: {
    reloadUser({commit, state}) {
      return new Promise((resolve, reject) => {
        axios({url: process.env.VUE_APP_REST_SERVER_URL+'/userdata/getuser/'+state.user._id, method: 'GET' })
        .then(resp => {
          commit('SET_USERINFO', resp.data.user);
          resolve(resp.data.user);
        })
        .catch(err => {
          console.log("reloadUser error: "+err);
          reject(err)
        })
      });
    },
    login({commit, state}, user){
      return new Promise((resolve, reject) => {
        commit('auth_request');
        axios({url: process.env.VUE_APP_REST_SERVER_URL+'/login', data: user, method: 'POST' })
        .then(resp => {
          const token = resp.data.token;
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = token;
          commit('auth_success', {token:token, user:resp.data.user});
          if (!state.currentRole) {
            state.currentRole = localStorage.getItem('cloudHavenCurrentRole');
          }
          if (!state.currentRole || !resp.data.user.roles.find(role=>(state.currentRole==role))) {
            commit('SET_ROLE', resp.data.user.roles[0]);
          }
          commit('SET_USERINFO', resp.data.user);
          resolve(resp.data.user);
        })
        .catch(err => {
          commit('auth_error')
          localStorage.removeItem('token')
          reject(err.response.status)
        })
      })
    },
    logout({commit}){
      return new Promise((resolve) => {
        commit('logout')
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        resolve()
      })
    },
    loadRecords({commit, state}, model) {
      return new Promise((resolve) => {
        try {
          (async () => {
            const response =  await state.apiMap[model].readAll();
            var records = response.data;
            commit('SET_DBOBJECTS', {model:model, records:records});
            resolve(records);
          })();
        } catch(e) {
          EventBus.$emit('global error alert', e+'');
          resolve(null);
        }
      })
    },
    createRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].create( payload.dbObject );
            if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
              resolve(null);
            } else if (response.errMsg) {
              EventBus.$emit('global error alert', response.errMsg );
              resolve(null);
            } else {
              commit('ADD_DBOBJECT', {model:payload.model, dbObject:response.data});
              EventBus.$emit('global success alert', payload.label+' added.' );
              resolve(response.data);
            }
          } catch(e) {
            EventBus.$emit('global error alert', e+'');
          }
        })();
      });
    },
    readRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].read( payload._id );
            if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            } else if (response.errMsg) {
              EventBus.$emit('global error alert', response.errMsg );
            } else {
              payload.dbObject = response.data;
              commit('UPDATE_DBOBJECT', payload );
              EventBus.$emit('global error alert', '');
            }
            resolve(response.data);
          } catch(e) {
            EventBus.$emit('global error alert', e+'');
          }
        })();
      });
    },
    updateRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].update( payload.dbObject );
            if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
              resolve(null);
            } else if (response.errMsg) {
              EventBus.$emit('global error alert', response.errMsg );
              resolve(null);
            } else {
              commit('UPDATE_DBOBJECT', payload );
              EventBus.$emit('global success alert', payload.label+' updated.' );
              resolve(response.data);
            }
          } catch(e) {
            EventBus.$emit('global error alert', e+'');
          }
        })();
      });
    },
    deleteRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        (async () => {
          try {
            var response = await state.apiMap[payload.model].delete( payload.dbObject._id );
            if (response.data.errMsg) {
              EventBus.$emit('global error alert', response.data.errMsg );
            } else {
              commit("DEL_DBOBJECT", payload)
              EventBus.$emit('global success alert', payload.label+' deleted.' );
            }
            resolve(true);
          } catch(e) {
            EventBus.$emit('global error alert', e+'');
          }
        })()
      })
    }
  },
  mutations: {
    auth_request(state){
      state.status = 'loading'
    },
    reload_user(state, cb) {
      var jsonUser = localStorage.getItem('ch_user');
      if (jsonUser) {
        state.user = JSON.parse(jsonUser);
      }
      state.currentRole = localStorage.getItem('cloudHavenCurrentRole')
      if (cb) (cb)(state.user)
    },
    auth_success(state, payload){
      state.status = 'success';
      state.token = payload.token;
      state.user = payload.user;
      state.user.rolesMap = payload.user.roles.reduce((mp,role)=>{
        mp[role] = role;
        return mp;
      },{});
//      localStorage.setItem('ch_user', JSON.stringify(state.user));
    },
    auth_error(state){
      state.status = 'error'
    },
    logout(state){
      state.status = ''
      state.token = ''
    },
    SET_ROLE: (state, role) => {
      localStorage.setItem('cloudHavenCurrentRole', role);
      state.currentRole = role;
    },
    SET_PIPELINE: (state, pipelineData ) => {
      state.pipelineData = pipelineData;
    },
    SET_CRUDAPISERVCE: ( state, model) => {
      if (!state.apiMap[model]) state.apiMap[model] = new CRUDApi(model)
    },
    SET_DBOBJECTS: ( state, payload ) => {
      state[payload.model] = payload.records;
    },
    ADD_DBOBJECT: ( state, payload ) => {
      state[payload.model].push(payload.dbObject);
    },
    DEL_DBOBJECT: (state, payload ) => {
      var idx = state[payload.model].indexOf( payload.dbObject )
      if (idx>=0) {
        state[payload.model].splice(idx,1);
      }
    },
    UPDATE_DBOBJECT: (state, payload ) => {
      var idx = state[payload.model].findIndex( (o) => {return o._id == payload.dbObject._id;} )
      if (idx>=0) {
        state[payload.model].splice(idx, 1, payload.dbObject);
      }
    },
    SET_USERINFO: (state, userInfo) => {
      state.user = Object.assign({}, userInfo);
      state.user.rolesMap = state.user.roles.reduce((mp,role)=>{
        mp[role] = role;
        return mp;
      },{});
      localStorage.setItem('ch_user', JSON.stringify(state.user));
    },
    SET_USER_SETTING(state, payload) {
      state.userSettings[payload.setting] = payload.value;
      setTimeout(()=>{
        localStorage.setItem(payload.setting, payload.value);
      }, 300)
    }
  }
})
