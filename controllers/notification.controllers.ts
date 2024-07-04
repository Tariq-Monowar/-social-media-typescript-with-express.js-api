import { INotification } from "../constants/interface";
import Notification from "../model/notification.models";
import { Request, Response } from "express";

interface CustomRequest extends Request {
    userId?: string;
  }

  export const createNotification = async (notificationData: any): Promise<INotification> => {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  };

export const getNotifications = async (req:CustomRequest, res:Response):Promise<void> => {
    try {
      const userId = req.userId;
      const notifications = await Notification.find({
          notificationRecever: userId,
      })
      .populate('notificationSender', 'userName image')
      .sort({ createdAt: -1 })
  
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json(error.message);
    }
  };


export const deleteNotification = async (req:Request, res:Response):Promise<void> => {
    try {
      const notificationId = req.params.id;
      const notification = await Notification.findByIdAndDelete(notificationId);
  
      if (!notification) {
        res.status(404).json({
          message: "Notification not found",
        });
        return 
      }
      res.status(201).json({
        message: "Notification delete successfully....",
      });
    } catch (error) {
      res.status(500).json(error.message);
    }
  };
