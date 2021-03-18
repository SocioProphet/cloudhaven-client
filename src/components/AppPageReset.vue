<template>
  <div></div>
</template>
<script>
import router from '../router'

export default {
  beforeCreate() {
    var app = this.$route.params.app;
    var page = this.$route.params.page || 'initUIConfig';
    router.push({ name: 'VendorAppPane', params: { userId: this.$store.state.user._id, app:app, page:page } })
  }
}
</script>
