<template>
<div style="background-color:#F0F0F0;padding:1px">
  <v-textarea 
    :class="commentClass"
    :label="comment.owner.name+' - '+(comment.created_at?$options.filters.datetime(comment.created_at):'')"
    :rows="commentRows"
    v-model="comment.content"
    :clearable="editMode"
    :append-outer-icon="actionIcon"
    dense hide-details
    filled
    :reverse="notMine" 
    :background-color="notMine?'#F0F0F0':'#FFFFFF'"
    :readonly="!editMode"
    @click="putInEditMode"
    @click:append-outer="commentAction"
  ></v-textarea>
  </div>
</template>
<script>
import Api from '@/services/Api'
import { mapState } from 'vuex'
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
      commentClass() {
        return this.notMine?"ml-4 mr-1 mb-1":"ml-1 mb-1";
      },
      notMine() {
        return this.user._id != this.comment.owner._id;
      },
      commentRows() {
        var lines = (this.comment.content||'').split(/\r|\r\n|\n/);
        return lines.length>5?5:(lines.length==0?1:lines.length);
      },
      actionIcon() {
        return this.editMode?'mdi-check-bold':'mdi-trash-can';
      },
      ...mapState(['user'])
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