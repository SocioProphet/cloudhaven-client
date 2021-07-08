<template>
<v-container class="justify-center">
  <v-row>
    <v-spacer></v-spacer>
  <v-card width="600px" class="ma-10">
    <v-card-title>
      <span class="text-h5">Organization Assignment</span>
    </v-card-title>

    <v-card-text>
      <div class="text-center pa-4 text-body-1 black--text">Complete your registration by creating your organization:</div>
      <v-form ref="form" v-model="valid" lazy-validation>
        <v-text-field v-model="name" label="Name" :rules="[rules.required]"></v-text-field>
        <v-text-field v-model="orgId" label="Id" :rules="[rules.required]"></v-text-field>
      </v-form>
      <v-alert class="mt-4 mx-4" :value="alertMsg?true:false" dense :type="alertType">{{alertMsg}}</v-alert>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn elevation="2" color="blue darken-1" text @click.native="save"><v-icon left dark>mdi-content-save</v-icon>Save</v-btn>
    </v-card-actions>
  </v-card>
    <v-spacer></v-spacer>
  </v-row>
</v-container>
</template>

<script>
import Api from '@/services/Api'
import router from '../router'

  export default {
    data: () => ({
      valid: true,
      error: '',
      rules: {
          required: value => !!value || 'Required.'
      },
      name: '',
      orgId: '',
      alertType: 'success',
      alertMsg: ''
    }),
    mounted () {
    },
    methods: {
      save () {
        if (!this.$refs.form.validate()) return;
        (async () => {
          var response = await Api().post("/organizationuser/createorg", {name:this.name, organizationId:this.orgId});
          if (response.data.success) {
            this.alertType = 'success';
            this.alertMsg = 'Organization created.';
            var dummy = await this.$store.dispatch('reloadUser');
            setTimeout(() => {
              this.$router.push('/appstore');
            }, 2000);
          } else {
            this.alertType = 'error';
            this.alertMsg = response.data.errMsg;
          }
        })();
      }
    }
  }
</script>
