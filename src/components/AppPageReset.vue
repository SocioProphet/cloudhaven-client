<template>
  <div></div>
</template>
<script>
import router from '../router'

export default {
  beforeCreate() {
    var app = this.$route.params.app;
    var page = this.$route.params.page || 'home';
    var appParams = this.$route.params.appParams
    router.push({ name: 'VendorAppPane', params: { userId: this.$store.state.user._id, app:app, page:page, appParams:appParams } })
  }
}
</script>
