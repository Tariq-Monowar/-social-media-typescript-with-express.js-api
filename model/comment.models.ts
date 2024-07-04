import { Schema, model, Document } from 'mongoose';
import { IComment, IReaction } from '../constants/interface';

const reactionSchema = new Schema<IReaction>({
  type: {
    type: String,
    enum: ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'],
    required: true,
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

const commentSchema = new Schema<IComment>({
  content: {type: String,required: true, trim: true},
  media: [{ type: String }],
  tag: Object,
  parentComment: { type: Schema.Types.ObjectId, ref: 'comment', default: null },

  reactions: [reactionSchema],
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  postId: { type: Schema.Types.ObjectId, ref: 'Post' }, 
  postUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  updated: { type: Boolean, default: false },
}, {
  timestamps: true,
});

commentSchema.virtual('children', {
  ref: 'comment',
  localField: '_id',
  foreignField: 'parentComment',
});

commentSchema.set('toObject', { virtuals: true });
commentSchema.set('toJSON', { virtuals: true });


export default model<IComment>('comment', commentSchema);




