import { Schema, model, Document } from "mongoose";
import { INotification } from "../constants/interface";

const notifySchema = new Schema<INotification>(
  {
    notificationRecever: {
      //যার কাছে পাঠানো হবে
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationSender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectId: { type: Schema.Types.ObjectId, ref: 'comment'},
    
    url: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      enum: [
        "friendRequest",
        "comment",
        "reactions",
        "notification",
        "post",
        "groups",
      ],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model<INotification>("Notify", notifySchema);
