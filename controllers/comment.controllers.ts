import { Request, Response } from "express";
import Post from "../model/posts.models";
import User from "../model/users.models";
import Comment from "../model/comment.models";
import { removeCloudinary, uploadMultipleFiles } from "../util/fireUploade";
import { createNotification } from "./notification.controllers";
import { getBaseUrl } from "../util/baseUrl";

interface CustomRequest extends Request {
  userId?: string;
}

export const createComment = async (req: CustomRequest, res: Response) => {
  try {
    const { content, tag, parentComment } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(400).json({
        message: "Post not found",
      });
      return;
    }
    console.log(typeof postId);
    console.log(typeof userId);

    const newComment = new Comment({
      user: userId,
      content,
      tag,
      postId,
      postUserId: post.user,
      parentComment,
    });

    if (req.files && req.files.media) {
      const files = Array.isArray(req.files.media)
        ? req.files.media
        : [req.files.media];
      const uploadedUrls = await uploadMultipleFiles(files);

      newComment.media = uploadedUrls;
    }

    await Post.findByIdAndUpdate(
      { _id: postId },
      { $push: { comments: newComment._id } },
      { new: true }
    );

    await newComment.save();

    res.status(200).json(newComment);

    /**
     * Notification.
     * যদি user নিযের পোষ্টে নিযেই কমেন্ট করে তাহলে পোষ্টকারির কাছের কাছে notification যাবে না
     * নিযের comment এ যসি নিযেই কমেন্ট করে তাহলে কমেন্টকারির এর কাছে notification যাবে না
     * কমেন্ট যদি child comment হয়ে তাহলে পোষ্টকারির কাছের নটিফিকেশন যাবে না। যদি না কমেন্ট টি পোষ্ট কারির হয়।
     */
    const postUserId = post.user;
    const baseUrl = `/post/${postId}`;
    const subjectId = newComment._id;

    if (newComment.postUserId != userId && !newComment.parentComment) {
      let notificatio = await createNotification({
        notificationSender: userId,
        notificationRecever: postUserId,
        subjectId,
        message: "Commented on post",
        url: baseUrl,
        icon: "comment",
      });
      console.log(notificatio);
    }
    if (newComment.parentComment) {
      let recever = await Comment.findOne({ _id: newComment.parentComment });
      console.log("rerver", recever?.user);
      if (userId != recever?.user) {
        let notificatio = await createNotification({
          notificationSender: userId,
          notificationRecever: recever?.user,
          subjectId,
          message: "Commented on post xxy",
          url: baseUrl,
          icon: "comment",
        });
        console.log(notificatio);
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

export const updateComments = async (req: CustomRequest, res: Response) => {
  try {
    const commentId = req.params.commentId;
    const { content, removeUrl } = req.body;
    const userId = req.userId;

    const comment = await Comment.findById(commentId);
    console.log(commentId, comment);
    if (!comment) {
      res.status(400).json({
        message: "Comment not found",
      });
      return;
    }

    if (comment.user?.toString() !== userId) {
      res.status(400).json({
        message: "you can't update this comment",
      });
      return;
    }

    if (content) {
      comment.content = content;
    }

    if (removeUrl) {
      //'post.media' is possibly 'undefined ts issue
      if (comment.media) {
        comment.media = comment.media.filter((url) => !removeUrl.includes(url));
      }
      await removeCloudinary(removeUrl);
    }

    if (req.files && req.files.media) {
      const files = Array.isArray(req.files.media)
        ? req.files.media
        : [req.files.media];

      const uploadedUrls = await uploadMultipleFiles(files);

      comment.media = [...(comment.media as any), ...uploadedUrls];
    }

    comment.updated = true;

    await comment.save();

    res.status(200).json(comment);

    const baseUrl = `/post/${comment.postId}`;

    if (comment.postUserId != userId) {
      let notificatio = await createNotification({
        notificationSender: userId,
        notificationRecever: comment.postUserId,
        subjectId: commentId,
        message: "Updated her comment",
        url: baseUrl,
        icon: "comment",
      });
      console.log(notificatio);
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteChildComments = async (parentId: any) => {
  const childComments = await Comment.find({ parentComment: parentId });

  if (childComments[0]) {
    // console.log(childComments[0]);
    if (childComments[0]?.media) {
      console.log(childComments[0]?.media);
      await removeCloudinary(childComments[0].media);
    }
    if (childComments[0]._id) {
      console.log(childComments[0]._id);
      await Comment.findByIdAndDelete(childComments[0]._id);
    }
    if (childComments[0].postId) {
      await Post.findByIdAndUpdate(childComments[0].postId, {
        $pull: { comments: childComments[0]._id },
      });
    }
  }

  for (const childComment of childComments) {
    await deleteChildComments(childComment);
  }
};

export const deleteComment = async (req: CustomRequest, res: Response) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(400).json({ message: "Comment not found" });
    }

    if (comment.user?.toString() !== userId) {
      return res.status(400).json({ message: "You can't delete this comment" });
    }
    // console.log(comment);
    if (comment?.media) {
      await removeCloudinary(comment.media);
      console.log(comment?.media);
    }
    console.log(comment._id);

    await deleteChildComments(comment._id);

    if (comment.parentComment) {
      await Post.findByIdAndUpdate(comment.postId, {
        $pull: { comments: comment._id },
      });
    }

    await comment.deleteOne({ _id: comment._id });

    res.status(201).json({ message: "delete Successfull" });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};

export const reactions = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.userId;
    const commentId = req.params.commentId;
    const { reactionType } = req.body;

    if (!userId) {
      res.status(400).json({
        message: "User not authenticated",
      });
      return;
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(400).json({
        message: "comment not found",
      });
      return;
    }

    const exReaction = comment.reactions.find(
      (react) => react.user.toString() === userId.toString()
    );

    let reNotify = false;
    if (exReaction) {
      if (exReaction.type === reactionType || !reactionType) {
        comment.reactions = comment.reactions.filter(
          (react) => react.user.toString() !== userId.toString()
        );
        reNotify = true;
      } else {
        exReaction.type = reactionType;
      }
    } else {
      const data = { type: reactionType, user: userId } as any;
      comment.reactions.push(data);
    }

    // let updatedPost;
    // if (exReaction) {
    //   if (exReaction.type === reactionType) {
    //     updatedPost = await Post.findOneAndUpdate(
    //       { _id: commentId },
    //       { $pull: { reactions: { user: userId } } },
    //       { new: true }
    //     );
    //   }
    //   updatedPost = await Post.findOneAndUpdate(
    //     { _id: commentId, "reactions.user": userId },
    //     { $set: { "reactions.$.type": reactionType } },
    //     { new: true }
    //   );
    // } else {
    //   updatedPost = await Post.findOneAndUpdate(
    //     { _id: commentId },
    //     { $push: { reactions: { type: reactionType, user: userId } } },
    //     { new: true }
    //   );
    // }
    await comment.save();
    res.json(comment);
    /**
     * Notification.
     * যদি user নিযের comment এ নিযেই React করে তাহলে comment কারির কাছের কাছে notification যাবে না
     * নিযের comment এ যসি নিযেই কমেন্ট করে তাহলে কমেন্টকারির এর কাছে notification যাবে না
     * কমেন্ট যদি child comment হয়ে তাহলে পোষ্টকারির কাছের নটিফিকেশন যাবে না। যদি না কমেন্ট টি পোষ্ট কারির হয়।
     */
    if (comment?.user?.toString() !== userId && reNotify) {
      let notificatio = await createNotification({
        notificationSender: userId,
        notificationRecever: comment.user,
        subjectId: commentId,
        message: "Reacted your comment",
        // url: baseUrl,
        icon: "reactions",
      });
      console.log(notificatio);
      reNotify = false;
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

export const showAllComments = async (req: CustomRequest, res: Response) => {
  try {
    res.status(200).json(await Comment.find());
  } catch (error) {
    res.status(500).json(error);
  }
};
