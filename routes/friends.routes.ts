import express, { Router } from "express";
import { verifyUser } from "../middleware/verifyUser";
import {
  getFriendList,
  rejectFriendRequest,
  sendRequest,
  acceptFriendRequest,
  unfriend,
  getSentFriendRequests,
  getFriendRequests,
  friend,
} from "../controllers/friends.controllers";

const route: Router = express.Router();

route.post("/send-request", verifyUser, sendRequest);
route.post("/reject-request", verifyUser, rejectFriendRequest);
route.post("/accept-request", verifyUser, acceptFriendRequest);
route.post("/un-friend", verifyUser, unfriend);

route.get("/friends-list", verifyUser, getFriendList);
route.get("/sent-requests", verifyUser, getSentFriendRequests);
route.get("/friend-request", verifyUser, getFriendRequests);

route.get("/friend", friend);

export default route;
