// import { Schema, model, Document, AnyArray, ObjectId } from "mongoose";

// export interface IUser extends Document {
//   userName: string;
//   email: string;
//   password: string;
//   location?: string;
//   dateOfBirth?: Date;
//   social: {
//     facebook?: string;
//     linkedin?: string;
//     github?: string;
//     twitter?: string;
//   };
//   image?: string;
//   backgroundImage?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface IFriends extends Document {
//   user: Schema.Types.ObjectId;
//   friend: Schema.Types.ObjectId;
//   status: "pending" | "accepted";
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface IMedia {
//   type: "image" | "video" | "file";
//   url: string;
// }

// export interface IReaction extends Document {
//   type: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";
//   user: ObjectId;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface IPost extends Document {
//   content?: string;
//   media?: string[];
//   reactions: IReaction[];
//   comments?: ObjectId[];
//   user?: ObjectId;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface CustomRequest extends Request {
//   userId?: string;
// }

// // export interface IComment extends Document {
// //   content: string;
// //   media?: string[];
// //   tag?: Record<string, any>;
// //   parentComment?: Schema.Types.ObjectId;
// //   reply?: Schema.Types.ObjectId;
// //   reactions?: IReaction[];
// //   user?: Schema.Types.ObjectId;
// //   postId?: Schema.Types.ObjectId;
// //   postUserId?: Schema.Types.ObjectId;
// //   updated: Boolean
// // }



// export interface IComment extends Document {
//   content: string;
//   media?: string[];
//   tag?: Record<string, any>;
//   parentComment?: Schema.Types.ObjectId;
//   reactions?: IReaction[];
//   user?: Schema.Types.ObjectId;
//   postId?: Schema.Types.ObjectId;
//   postUserId?: Schema.Types.ObjectId;
//   updated: boolean;
//   children?: IComment[]; 
//   comment: Schema.Types.ObjectId
// }

import { Schema, Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  userName: string;
  email: string;
  password: string;
  location?: string;
  dateOfBirth?: Date;
  social: {
    facebook?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
  image?: string;
  backgroundImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFriends extends Document {
  user: Schema.Types.ObjectId;
  friend: Schema.Types.ObjectId;
  status: "pending" | "accepted";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMedia {
  type: "image" | "video" | "file";
  url: string;
}

export interface IReaction extends Document {
  type: "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";
  user: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPost extends Document {
  content?: string;
  media?: string[];
  reactions: IReaction[];
  comments?: ObjectId[];
  user?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface CustomRequest extends Request {
  userId?: string;
}

export interface IComment extends Document {
  content: string;
  media?: string[];
  tag?: Record<string, any>;
  parentComment?: Schema.Types.ObjectId;
  reactions: IReaction[];
  user?: Schema.Types.ObjectId;
  postId?: Schema.Types.ObjectId;
  postUserId?: Schema.Types.ObjectId;
  updated: boolean;
  children?: IComment[]; 
  comment: Schema.Types.ObjectId;
}

export interface INotification extends Document {
  notificationRecever?: Schema.Types.ObjectId | string;
  notificationSender?: Schema.Types.ObjectId | string;
  subjectId: Schema.Types.ObjectId | string;
  url?: string;
  message: string;
  icon?: "friendRequest" | "comment" | "reactions" | "notification" | "post" | "groups";
  isRead?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}