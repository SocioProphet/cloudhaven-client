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
    vendors: [],
    resultNotification:{msg:'',type:''},
    currentRole:'',
    status: '',
    token: localStorage.getItem('token') || '',
    user: {rolesMap:{}},
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
            var records = response.data.data.records;
            commit('SET_DBOBJECTS', {model:model, records:records});
            resolve(records);
          })();
        } catch(e) {
          commit('SET_ERRMSG', e+'');
          resolve(null);
        }
      })
    },
    createRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        commit('SET_RESULTNOTIFICATION', '');
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].create( payload.dbObject );
            if (response.data.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.data.errMsg, type:'error'});
              resolve(null);
            } else if (response.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.errMsg, type:'error'});
              resolve(null);
            } else {
              commit('ADD_DBOBJECT', {model:payload.model, dbObject:response.data.data.record});
              commit('SET_RESULTNOTIFICATION', {msg:payload.label+' added.', type:'success'});
              resolve(response.data.data.record);
            }
          } catch(e) {
            commit('SET_ERRMSG', e+'');
          }
        })();
      });
    },
    readRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        commit('SET_RESULTNOTIFICATION', '');
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].read( payload._id );
            if (response.data.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.data.errMsg, type:'error'});
            } else if (response.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.errMsg, type:'error'});
            } else {
              payload.dbObject = response.data.data.record;
              commit('UPDATE_DBOBJECT', payload );
              commit('SET_ERRMSG', '');
            }
            resolve(response.data.data.record);
          } catch(e) {
            commit('SET_ERRMSG', e+'');
          }
        })();
      });
    },
    updateRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        commit('SET_RESULTNOTIFICATION', '');
        (async () => {
          try {
            const response =  await state.apiMap[payload.model].update( payload.dbObject );
            if (response.data.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.data.errMsg, type:'error'});
              resolve(null);
            } else if (response.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.errMsg, type:'error'});
              resolve(null);
            } else {
              commit('UPDATE_DBOBJECT', payload );
              commit('SET_RESULTNOTIFICATION', {msg:payload.label+' updated.', type:'success'});
              resolve(response.data.data.record);
            }
          } catch(e) {
            commit('SET_ERRMSG', e+'');
          }
        })();
      });
    },
    deleteRecord({commit, state}, payload) {
      return new Promise((resolve) => {
        (async () => {
          try {
            commit('SET_RESULTNOTIFICATION', '')
            var response = await state.apiMap[payload.model].delete( payload.dbObject._id );
            if (response.data.errMsg) {
              commit('SET_RESULTNOTIFICATION', {msg:response.data.errMsg, type:'error'})
            } else {
              commit("DEL_DBOBJECT", payload)
              commit('SET_RESULTNOTIFICATION', {msg:payload.label+' deleted.', type:'success'})
            }
            resolve(true);
          } catch(e) {
            commit('SET_ERRMSG', e+'');
          }
        })()
      })
    }
  },
  mutations: {
    auth_request(state){
      state.status = 'loading'
    },
    reload_user(state) {
      var jsonUser = localStorage.getItem('ch_user');
      if (jsonUser) {
        state.user = JSON.parse(jsonUser);
      }
      state.currentRole = localStorage.getItem('cloudHavenCurrentRole')
    },
    auth_success(state, payload){
      state.status = 'success';
      state.token = payload.token;
      state.user = payload.user;
      state.user.rolesMap = payload.user.roles.reduce((mp,role)=>{
        mp[role] = role;
        return mp;
      },{});
      localStorage.setItem('ch_user', JSON.stringify(state.user));
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
    SET_ERRMSG: ( state, errMsg) => {
      state.resultNotification = errMsg==''?{msg:'',type:''}:{msg:errMsg, type:'error'}
      if (errMsg) {
        EventBus.$emit('global error alert', errMsg);
      }
    },
    SET_SUCCESS: ( state, msg ) => {
      state.resultNotification = msg?{msg:msg,type:'success'}:{msg:'',type:''};
      if (msg) {
        EventBus.$emit('global success alert', msg);
      }
    },
    SET_RESULTNOTIFICATION: ( state, resultNotification) => {
      state.resultNotification = resultNotification?resultNotification:{msg:'',type:''};
      if (resultNotification && resultNotification.msg) {
        EventBus.$emit(`global ${resultNotification.type||'success'} alert`, resultNotification.msg);
      }
    },
    SET_USERINFO: (state, userInfo) => {
      state.user._id = userInfo._id;
      state.user.recentCases = userInfo.recentCases;
      state.user.roles = userInfo.roles;
      state.user.rolesMap = state.user.roles.reduce((mp,role)=>{
        mp[role] = role;
        return mp;
      },{})
    },
    SET_USER_SETTING(state, payload) {
      state.userSettings[payload.setting] = payload.value;
      setTimeout(()=>{
        localStorage.setItem(payload.setting, payload.value);
      }, 300)
    }
  }
})
