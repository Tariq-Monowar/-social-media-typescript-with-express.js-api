import express, { Router } from "express";
import { verifyUser } from "../middleware/verifyUser";
import { deleteNotification, getNotifications } from "../controllers/notification.controllers";
const router: Router = express.Router();

router.get("/", verifyUser, getNotifications);
router.delete("/delete/:id",verifyUser, deleteNotification);
 
export default router;
