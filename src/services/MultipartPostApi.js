import axios from 'axios'
import { EventBus } from '../event-bus.js';

export default() => {
    var instance = axios.create({
        baseURL: process.env.VUE_APP_REST_SERVER_URL,
        withCredentials: false,
//        responseType: 'blob', //Force to receive data in a Blob Format
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
    })
    instance.interceptors.response.use(response => {
        return response;
      }, error => {
        if (error.response) {
          if (error.response.status === 401) {
              EventBus.$emit('errors:401')
              return Promise.reject(error.response.status)
            } else {
              EventBus.$emit('error', error.response.data)
              return Promise.reject(error.response.status)
            }
        } else if (error.message) {
          console.log(error.message);
          EventBus.$emit('error', error.message)
          return Promise.reject(error.message)
        }
    })
    return instance;
  }

