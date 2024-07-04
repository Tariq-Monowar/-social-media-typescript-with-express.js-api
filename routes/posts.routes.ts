import express, { Router } from "express";
import { verifyUser } from "../middleware/verifyUser";
import {
  readPost,
  readSinglePost,
  createPost,
  updatePost,
  deletePost,
  reactions,
} from "../controllers/posts.controllers";

const router: Router = express.Router();

router.get("/", readPost);
router.get("/:postId", readSinglePost);
router.post("/", verifyUser, createPost);
router.patch("/:postId", verifyUser, updatePost);
router.delete("/:postId", verifyUser, deletePost);
router.patch("/reactions/:postId", verifyUser, reactions);

export default router;
