<template>
  <v-textarea 
    class="mx-2 "
    :label="comment.owner.name+' - '+(comment.created_at?$options.filters.datetime(comment.created_at):'')"
    rows="3"
    v-model="comment.content"
    :clearable="editMode"
    :append-outer-icon="actionIcon"
    dense
    :readonly="!editMode"
    @click="putInEditMode"
    @click:append-outer="commentAction"
  ></v-textarea>
</template>
<script>
import Api from '@/services/Api'
import moment from 'moment'
  export default {
    props: {
      conversation: { type: Object, required: true},
      comment: { type: Object, required: true}
    },
    filters: {
      datetime(value) {
        return value?moment(value).format('l LT'):'';
      }
    },
    data() {
      return {
        editMode: false
      }
    },
    mounted() {
    },
    computed: {
      actionIcon() {
        return this.editMode?'mdi-check-bold':'mdi-trash-can';
      } 
    },
    methods: {
      putInEditMode() {
        if (!this.editMode) this.editMode = true;
      },
      commentAction() {
        if (this.editMode) {
          (async () => {
            var response = await Api().post('/conversation/updatecomment', 
              { contentId:this.comment._id, content: this.comment.content });
            this.$emit('updateComment', this.comment);
            this.editMode = false;
          })();          
        } else {
          this.$emit('deleteComment', this.comment);
        }
      }
    }
    
  }
</script>