<template>
  <V-form>
    <v-card>
      <v-card-title>Conversation</v-card-title>
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
          var response = await Api().get('/conversation/'+this.topic);
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
          debugger;
        (async () => {
          var response = null;
          debugger;
          if (!this.conversation._id && this.conversation.comments.length==0) {
            response = await Api().post('/conversation/create',
              { userId: this.$store.state.user._id, topic: this.topic, content: this.newComment });
              debugger;
            this.conversation = response.data.conversation;
          } else {
            response = await Api().post('/conversation/addcomment',
              { conversationId: this.conversation._id,
                authorId: this.$store.state.user._id,
                content: this.newComment
              });
              var comment = Object.assign({},response.data.content);
              comment.owner = Object.assign({}, this.$store.state.user);
              this.conversation.comments.push(comment);
              debugger;
          }
          this.newComment = '';
        })();
        },
        updateComment(comment) {
          var curComment = this.conversation.comments.find(c=>(c._id==comment._id))
          if (curComment) {
            curComment.content = comment.content;
            debugger;
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