import dotenv from "dotenv";
import { Request, Response } from "express";
import User from "../model/users.models";
import Friend from "../model/friends.models";

dotenv.config();

interface CustomRequest extends Request {
  userId?: string;
}

export const sendRequest = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.userId;
    let { receiverId } = req.body;

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      res.status(404).json({
        message: "Receiver not found",
      });
      return;
    }

    if (senderId === receiverId) {
      res.status(404).json({
        message: "you don't send request in you",
      });
      return;
    }

    // friend request already exists
    const existingFriendReques = await Friend.findOne({
      user: senderId,
      friend: receiverId,
      status: "pending",
    });
    if (existingFriendReques) {
      res.status(400).json({
        message: "Friend request already sent",
      });
      return;
    }

    const alreadyFriends = await Friend.findOne({
      user: senderId,
      friend: receiverId,
      status: "accepted",
    });
    if (alreadyFriends) {
      res.status(400).json({
        message: "You are already friends",
      });
      return;
    }

    const sendFriendRequest = await new Friend({
      user: senderId,
      friend: receiverId,
      status: "pending",
    });

    const result = await sendFriendRequest.save();

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const rejectFriendRequest = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    console.log(userId);
    const { friendId } = req.body;

    // Check if the friend request exists and involves the user and friend in either direction
    const existFriendRequest = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "pending" },
        { user: friendId, friend: userId, status: "pending" },
      ],
    });

    if (!existFriendRequest) {
      res.status(404).json({
        message: "Friend request does not exist",
      });
      return;
    }

    // Remove the friend request
    await Friend.deleteOne({ _id: existFriendRequest._id });

    res.status(200).json({
      message: "Friend request rejected",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const acceptFriendRequest = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const { friendId } = req.body;

    const friendRequest = await Friend.findOne({
      user: friendId,
      friend: userId,
      status: "pending",
    });
    console.log(friendRequest);

    if (!friendRequest) {
      res.status(404).json({
        message: "Friend request does not exist",
      });
      return;
    }

    friendRequest.status = "accepted";

    await friendRequest.save();

    res.status(200).json({
      message: "Friend request accepted",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const unfriend = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    console.log(userId);
    const { friendId } = req.body;

    // Check if the friend request exists and involves the user and friend in either direction
    const findFriend = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" },
      ],
    });

    if (!findFriend) {
      res.status(404).json({
        message: "Friend request does not exist",
      });
      return;
    }

    // Remove the friend request
    await Friend.deleteOne({ _id: findFriend._id });

    res.status(200).json({
      message: "unfriend successfull",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getFriendList = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    // Find all friends where the user is involved and the status is "accepted"
    const friends = await Friend.find({
      $or: [
        { user: userId, status: "accepted" },
        { friend: userId, status: "accepted" },
      ],
    }).populate({
      path: "user friend",
      select: "-social -email -password -createdOn -backgroundImage",
    });

    // Extract the friend IDs
    const friendList = friends.map((f) =>
      f.user.toString() === userId ? f.friend : f.user
    );

    res.status(200).json(friendList);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getSentFriendRequests = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    // Find all friend requests sent by the user where the status is "pending"
    const sentRequests = await Friend.find({
      user: userId,
      status: "pending",
    }).populate({
      path: "friend",
      select: "-social -email -password -createdOn -backgroundImage",
    });

    // Extract the receiver IDs
    const sentRequestList = sentRequests.map((req) => req.friend);

    res.status(200).json(sentRequestList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFriendRequests = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    // Find all friend requests sent by the user where the status is "pending"
    const sentRequests = await Friend.find({
      friend: userId,
      status: "pending",
    }).populate({
      path: "friend",
      select: "-social -email -password -createdOn -backgroundImage",
    });

    // Extract the receiver IDs
    const sentRequestList = sentRequests.map((req) => req.friend);

    res.status(200).json(sentRequestList);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const friend = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const friend  = await Friend.find()
    res.status(200).json(friend)
  } catch (error) {
    res.status(500).json(error);
  }
};

// export const getFriendList = async (
//   req: CustomRequest,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.userId;

//     const getList = await Friend.find({ userId });

//     res.status(200).json(getList);
//   } catch (error) {
//     res.status(500).json(error);
//   }
// };

// // Check if a friend request already exists or if they are already friends
// const existingFriendRelationship = await Friend.findOne({
//   $or: [
//     { user: senderId, friend: receiverId },
//     { user: receiverId, friend: senderId }
//   ],
//   status: { $in: ["pending", "accepted"] },
// });

// if (existingFriendRelationship) {
//   if (existingFriendRelationship.status === "pending") {
//     res.status(400).json({
//       message: "Friend request already sent",
//     });
//   } else if (existingFriendRelationship.status === "accepted") {
//     res.status(400).json({
//       message: "You are already friends",
//     });
//   }
//   return;
// }
