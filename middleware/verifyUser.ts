import { verify } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";

interface CustomRequest extends Request {
  userEmail?: string;
  userId?: string;
}

dotenv.config();

export const verifyUser = async (
  req: CustomRequest, 
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization;
  if (!token) {
    res.status(400).json({
      message: "Unauthorized user",
    });
    return;
  }
  try {
    const decodedToken = verify(
      token,
      process.env.WEBTOKEN_SECRET_KEY as string
    ) as { userEmail: string; userId: string };
    req.userEmail = decodedToken.userEmail;
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "Invalid token",
    });
    return;
  }
};


