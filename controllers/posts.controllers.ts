import { Request, Response } from "express";
import Post from "../model/posts.models";
import User from "../model/users.models";
import Comment from "../model/comment.models";
import {
  removeCloudinary,
  removeFromCloudinary,
  uploadMultipleFiles,
} from "../util/fireUploade";
import { ObjectId, Types } from "mongoose";
import { IComment } from "../constants/interface";
import { createNotification } from "./notification.controllers";

interface CustomRequest extends Request {
  userId?: string;
}

export const createPost = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { content } = req.body;
    const userId = req.userId;

    const newPost = new Post({
      content,
      user: userId,
    });

    if (req.files && req.files.media) {
      const files = Array.isArray(req.files.media)
        ? req.files.media
        : [req.files.media];
      const uploadedUrls = await uploadMultipleFiles(files);

      newPost.media = uploadedUrls;
    }

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const updatePost = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const post_id = req.params.postId;
    const { removeUrl } = req.body;

    const post = await Post.findById(post_id);
    if (!post) {
      res.status(400).json({
        message: "Post not found",
      });
      return;
    }

    if (post.user?.toString() !== userId) {
      res.status(403).json({
        message: "You can't update this post",
      });
      return;
    }

    if (req.body.content) {
      post.content = req.body.content;
    }

    if (removeUrl) {
      console.log(removeUrl);
      //'post.media' is possibly 'undefined ts issue
      if (post.media) {
        post.media = post.media.filter((url) => !removeUrl.includes(url));
      }
      await removeCloudinary(removeUrl);
    }

    if (req.files && req.files.media) {
      const files = Array.isArray(req.files.media)
        ? req.files.media
        : [req.files.media];

      const uploadedUrls = await uploadMultipleFiles(files);

      post.media = [...(post.media as any), ...uploadedUrls];
    }

    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const deletePost = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    const post_id = req.params.postId;

    const post = await Post.findById(post_id);
    if (!post) {
      res.status(400).json({
        message: "Post not found",
      });
      return;
    }

    if (post.user?.toString() !== userId) {
      res.status(403).json({
        message: "You can't update this post",
      });
      return;
    }

    if (post.media) {
      await removeCloudinary(post.media);
    }

    await Post.findByIdAndDelete(post._id);
    res.status(500).json({
      message: "post delete successfull",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const reactions = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    const postId = req.params.postId;
    const { reactionType } = req.body;

    if (!userId) {
      res.status(400).json({
        message: "User not authenticated",
      });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({
        message: "Post not found",
      });
      return;
    }

    let reNotify = true
    const exReaction = post.reactions.find(
      (react) => react.user.toString() === userId.toString()
    );

    if (exReaction) {
      if (exReaction.type === reactionType || !reactionType) {
        post.reactions = post.reactions.filter(
          (react) => react.user.toString() !== userId.toString()
        );
        reNotify = false
      } else {
        exReaction.type = reactionType;
      }
    } else {
      const data = { type: reactionType, user: userId } as any;
      post.reactions.push(data);
    }

    // let updatedPost;
    // if (exReaction) {
    //   if (exReaction.type === reactionType) {
    // updatedPost = await Post.findOneAndUpdate(
    //   { _id: postId },
    //   { $pull: { reactions: { user: userId } } },
    //   { new: true }
    // );
    //   }
    //   updatedPost = await Post.findOneAndUpdate(
    //     { _id: postId, "reactions.user": userId },
    //     { $set: { "reactions.$.type": reactionType } },
    //     { new: true }
    //   );
    // } else {
    //   updatedPost = await Post.findOneAndUpdate(
    //     { _id: postId },
    //     { $push: { reactions: { type: reactionType, user: userId } } },
    //     { new: true }
    //   );
    // }
    await post.save();
    res.json(post);


    if (post?.user?.toString() !== userId && reNotify) {
      let notificatio = await createNotification({
        notificationSender: userId,
        notificationRecever: post.user,
        subjectId: post._id,
        message: "Reacted your post",
        // url: baseUrl,
        icon: "reactions",
      });
      console.log(notificatio);
      console.log(reNotify)
      reNotify = false;
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

const populateComments = async (comment: any): Promise<any> => {
  await comment.populate("user", "userName image email");
  const children = await Comment.find({ parentComment: comment._id })
    .populate("user", "userName image email")
    .populate("reactions.user", "userName image email")
    .exec();

  for (let child of children) {
    await populateComments(child);
  }

  comment.children = children;
  return comment;
};

export const readPost = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("user", "userName image email")
      .populate("reactions.user", "userName image email")
      .populate({
        path: "comments",
        match: { parentComment: null },
        populate: { path: "user", select: "userName image email" },
      })
      .exec();

    for (let post of posts) {
      const comments = post.comments || [];
      for (let comment of comments) {
        await populateComments(comment);
      }
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
};

export const readSinglePost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId)
      .populate("user", "userName image email")
      .populate("reactions.user", "userName image email")
      .populate({
        path: "comments",
        match: { parentComment: null },
        populate: { path: "user", select: "userName image email" },
      })
      .exec();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = post.comments || [];
    for (let comment of comments) {
      await populateComments(comment);
    }
  

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json(error.message);
  }
};

// https://medium.com/@pmadhav279/building-dynamic-conversations-a-step-by-step-guide-to-implementing-a-nested-comment-system-in-56055a586a50
