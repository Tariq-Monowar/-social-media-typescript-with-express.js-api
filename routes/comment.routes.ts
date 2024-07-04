import express, { Router } from "express";
import { verifyUser } from "../middleware/verifyUser";
import {
  createComment,
  deleteComment,
  updateComments,
  reactions,
} from "../controllers/comment.controllers";

const router: Router = express.Router();

router.post("/:postId", verifyUser, createComment);
router.patch("/:commentId", verifyUser, updateComments);
router.delete("/:commentId", verifyUser, deleteComment);
router.patch("/reactions/:commentId", verifyUser, reactions);

export default router;
