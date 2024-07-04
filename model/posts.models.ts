// import { Schema, model } from 'mongoose';
// import { IMedia, IPost, IReaction } from '../constants/interface';

// const reactionSchema = new Schema<IReaction>({
//   type: {
//     type: String,
//     enum: ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'],
//     required: true
//   },
//   user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
// }, {
//   timestamps: true
// });

// const postSchema = new Schema<IPost>({
//   content: { type: String },
//   media: [{ type: String }],
//   reactions: [reactionSchema],
//   comments: [{ type: Schema.Types.ObjectId, ref: 'comment' }],
//   user: { type: Schema.Types.ObjectId, ref: 'User' },
// }, {
//   timestamps: true,
// });

// export default model<IPost>('Post', postSchema);


import { Schema, model } from 'mongoose';
import { IPost, IReaction } from '../constants/interface';

const reactionSchema = new Schema<IReaction>({
  type: {
    type: String,
    enum: ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'],
    required: true
  },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

const postSchema = new Schema<IPost>({
  content: { type: String },
  media: [{ type: String }],
  reactions: [reactionSchema],
  comments: [{ type: Schema.Types.ObjectId, ref: 'comment' }],
  user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

export default model<IPost>('Post', postSchema);
