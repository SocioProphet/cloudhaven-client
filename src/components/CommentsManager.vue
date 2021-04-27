<template>
  <V-form>
    <v-card>
      <v-card-title>Conversation {{conversation.topic}}</v-card-title>
        <v-card-text>
          <comment v-for="comment in conversation.comments" 
          :key="comment._id"
          :comment="comment"
          :conversation="conversation"
          @deleteComment="deleteComment"
          @updateComment="updateComment"
          ></comment>
        </v-card-text>
        <v-card-actions>
            <v-textarea
              append-icon="mdi-send"
              class="mx-2"
              outlined
              dense
              v-model="newComment"
              placeholder='Type a new comment here and click the send icon on the right.'
              @click:append="addComment"
              rows="3"
            ></v-textarea>
        </v-card-actions>
    </v-card>
  </V-form>
</template>
<script>
import Comment from './CommentItem.vue'
import Api from '@/services/Api'
    export default {
    props: {
      vendorId: { type: String},
      application: { type: Object },
      topic: { type: String, required: true}
    },
      components: {
        Comment
      },
      data () {
        return {
          newComment: '',
          conversation: {
            comments:[]
          }
        }
      },
      created() {
      },
      mounted() {
        (async () => {
          var response = await Api().post('/conversation',{application:this.application, topic: this.topic})
          console.log(response.data);
          if (response.data) {
            this.conversation = response.data;
          } else {
            this.conversation = {comments:[]};
          }
        })();
      },
      methods: {
        addComment() {
        (async () => {
          var response = null;
          if (!this.conversation._id && this.conversation.comments.length==0) {
            response = await Api().post('/conversation/create',
              { userId: this.$store.state.user._id, application: this.application, topic: this.topic, content: this.newComment });
            this.conversation = response.data.conversation;
          } else {
            response = await Api().post('/conversation/addcomment',
              { conversationId: this.conversation._id,
                authorId: this.$store.state.user._id,
                content: this.newComment
              });
              var comment = Object.assign({},response.data);
              comment.owner = Object.assign({}, this.$store.state.user);
              this.conversation.comments.push(comment);
          }
          this.newComment = '';
        })();
        },
        updateComment(comment) {
          var curComment = this.conversation.comments.find(c=>(c._id==comment._id))
          if (curComment) {
            curComment.content = comment.content;
          }
        },
        deleteComment(comment) {
          ///comment/:conversationId/:commentId
          (async () => {
            var response = await Api().delete('/conversation/comment/'+this.conversation._id+'/'+comment._id)
            this.conversation.comments = this.conversation.comments.filter(c=>(c._id!=comment._id))
          })();
        }
      }
    }
</script>