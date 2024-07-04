import { Schema, model} from "mongoose";
import { IFriends } from "../constants/interface";


const friendSchema = new Schema<IFriends>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  friend: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted"],
    default: "pending",
  },
}, { timestamps: true });

export default model<IFriends>("Friends", friendSchema);
