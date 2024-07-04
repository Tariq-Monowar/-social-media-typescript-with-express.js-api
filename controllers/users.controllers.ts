import dotenv from "dotenv";
import { Request, Response } from "express";
import User from "../model/users.models";
import { isEmail } from "validator";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { sign, verify } from "jsonwebtoken";
import {
  emailForgotPasswordOTP,
  emailMessage,
  emailUpdateOTP,
} from "../constants/email_message";
import { UploadedFile } from "express-fileupload";
import { uploadFile } from "../util/fireUploade";

dotenv.config();

declare module "express-session" {
  interface SessionData {
    otp: string;
    userData?: {
      userName: string;
      password: string;
      email: string;
    };
    email?: string;
    isOtpValid: Boolean;
  }
}

interface CustomRequest extends Request {
  userId?: string;
}

let mailTransporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  service: "gmail",
  auth: {
    user: process.env.NODE_MAILER_USER,
    pass: process.env.NODE_MAILER_PASSWORD,
  },
});

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let user = await User.find();
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
  }
};

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { userName, email, password, conformPassword } = req.body;

    if (!(userName && email && password && conformPassword)) {
      res.status(400).json({
        message: "Please fill all required fields",
      });
      return;
    }

    userName = userName.replace(/\s+/g, " ").trim();

    // email manage.....
    const exuser = await User.findOne({ email });
    if (exuser) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }
    if (!isEmail(email)) {
      res.status(400).json({
        message: "Please enter a valid email address",
      });
      return;
    }
    if (email === userName) {
      res.status(400).json({
        message: "Email cannot be the same as your username",
      });
      return;
    }

    // password......
    if (password !== conformPassword) {
      res.status(400).json({
        message: "Password does not match confirm password",
      });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({
        message: "Password must be longer than 6 characters",
      });
      return;
    }
    if (password === userName || password === email) {
      res.status(400).json({
        message: "Password cannot be the same as your username or email",
      });
      return;
    }

    // password encryption
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    // generate OTP......
    const OTP = Math.floor(1000 + Math.random() * 9000);

    // Save user data and OTP in session
    req.session.otp = OTP.toString();
    req.session.userData = { userName, password, email };

    let mailOptions = {
      from: "no-reply@yourdomain.com",
      to: email,
      subject: "Your OTP Code for SocialApp",
      html: emailMessage(userName, email, OTP),
    };

    // Send email
    mailTransporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Message sent");
      }
    });

    res.status(200).json({ message: "OTP send Successfull" });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp } = req.body;
    console.log(req.session.otp, req.session.userData);

    // Check if userData exists and has required fields
    if (
      !req.session.userData ||
      !req.session.userData.userName ||
      !req.session.userData.email ||
      !req.session.userData.password
    ) {
      res.status(400).json({
        message: "User data is incomplete",
      });
      return;
    }

    if (otp !== req.session.otp) {
      res.status(400).json({
        message: "Invalid OTP",
      });
      return;
    }

    // Create a new User instance
    const newUser = new User(req.session.userData);

    // Generate JWT token
    const token = sign(
      { userEmail: newUser.email, userId: newUser._id },
      process.env.WEBTOKEN_SECRET_KEY as string,
      { expiresIn: "4h" }
    );

    // Save the new user
    await newUser.save();

    // Clear session data after successful save
    delete req.session.userData;
    delete req.session.otp;

    res.status(200).json({
      message: { token, user: newUser },
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const authenticateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email && !password) {
      res.status(400).json({
        message: "Please fill all required fields",
      });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({
        message: `users not found!`,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(400).json({
        message: "Invalid email or password",
      });
      return;
    }

    const token = sign(
      { userEmail: user.email, userId: user._id },
      process.env.WEBTOKEN_SECRET_KEY as string,
      { expiresIn: "5h" }
    );

    res.status(200).json({ token: token, user });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const editUserProfile = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    let {
      userName,
      location,
      dateOfBirth,
      facebook,
      linkedin,
      github,
      twitter,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(400).json({
        message: `User not found`,
      });
      return;
    }

    if (userName) {
      user.userName = userName.replace(/\s+/g, " ").trim();
    }
    if (location) {
      user.location = location;
    }
    if (dateOfBirth) {
      user.dateOfBirth = dateOfBirth;
    }

    if (facebook) {
      user.social.facebook = facebook;
    }

    if (linkedin) {
      user.social.linkedin = linkedin;
    }

    if (github) {
      user.social.github = github;
    }

    if (twitter) {
      user.social.twitter = twitter;
    }

    // Handle image upload if present
    if (req.files && req.files.image) {
      const uploadedImage = req.files.image as UploadedFile;
      const responce = await uploadFile(uploadedImage, user.image as string);
      if (responce) {
        console.log("responced");
        user.image = responce;
      }
    }

    if (req.files && req.files.backgroundImage) {
      const uploadedImage = req.files.backgroundImage as UploadedFile;
      const responce = await uploadFile(
        uploadedImage,
        user.backgroundImage as string
      );
      if (responce) {
        console.log("responced");
        user.backgroundImage = responce;
      }
    }

    const updatedUser = await user.save();
    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const verifyPassword = async (req: CustomRequest, res: Response) : Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        message: `password is empty`,
      });
      return;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(400).json({
        message: `User not found`,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(400).json({
        message: "password dose not match",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "password is match",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

//email change
export const requestEmailUpdateOTP = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(400).json({
        message: `User not found`,
      });
      return;
    }
    if (email === user.email) {
      res.status(400).json({
        message: `it's youe email`,
      });
      return;
    }

    const exuser = await User.findOne({ email });
    if (exuser) {
      res
        .status(400)
        .json({ message: "this Email already exists another acount" });
      return;
    }

    if (!isEmail(email)) {
      res.status(400).json({
        message: "Please enter a valid email address",
      });
      return;
    }

    if (user.email === email) {
      res.status(400).json({
        message: `Email is allrady user`,
      });
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    req.session.otp = otp.toString();
    req.session.email = email;

    let mailOptions = {
      from: "no-reply@yourdomain.com",
      to: email,
      subject: "Your OTP Code for SocialApp",
      html: emailUpdateOTP(user.userName, email, otp),
    };

    mailTransporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Message sent");
      }
    });

    res.status(200).json({ message: "OTP send Successfull for change email" });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const confirmEmailUpdate = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    console.log(req.session.otp);
    const { otp } = req.body;

    if (otp !== req.session.otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      res.status(400).json({ message: `User not found` });
      return;
    }

    if (!req.session.email) {
      res.status(400).json({ message: "Email not found in session" });
      return;
    }

    user.email = req.session.email;

    delete req.session.otp;
    delete req.session.email;

    const updatedUser = await user.save();
    res.status(201).json(updatedUser);
  } catch (error) {
    res.status(500).json(error);
  }
};

//password change
export const forgotPasswordOTPsend = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: `User not found`,
      });
      return;
    }
    const otp = Math.floor(1000 + Math.random() * 9000);

    req.session.otp = otp.toString();
    req.session.email = user.email;

    let mailOptions = {
      from: "no-reply@yourdomain.com",
      to: user.email,
      subject: "Your OTP Code for SocialApp",
      html: emailForgotPasswordOTP(user.userName, user.email, otp),
    };

    mailTransporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Message sent");
      }
    });

    res
      .status(200)
      .json({ message: "OTP send Successfull for change password" });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const matchForgotPasswordOTP = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { otp } = req.body;
    console.log(req.session.otp);

    if (!otp) {
      res.status(400).json({
        message: `OTP is requird`,
      });
      return;
    }

    if (otp !== req.session.otp || otp === undefined) {
      res.status(400).json({
        message: `OTP Not metch`,
      });
      return;
    }

    req.session.isOtpValid = true;

    res.status(200).json({
      success: true,
      message: "OTP metch successfully",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

export const resetPasssword = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.session.isOtpValid) {
      res.status(400).json({ message: "OTP validation required" });
      return;
    }

    const email = req.session.email;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({
        message: `User not found`,
      });
      return;
    }

    let { password, conformPassword } = req.body;

    if (!password || !conformPassword) {
      res.status(400).json({
        message: "Please fill all required fields",
      });
      return;
    }
    if (password !== conformPassword) {
      res.status(400).json({
        message: "Password does not match confirm password",
      });
      return;
    }

    // password encryption
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    user.password = password;

    const token = sign(
      { userEmail: user.email, userId: user._id },
      process.env.WEBTOKEN_SECRET_KEY as string,
      { expiresIn: "4h" }
    );

    const updatedUser = await user.save();

    // Clear session data after successful save
    delete req.session.email;
    delete req.session.otp;
    delete req.session.isOtpValid;

    res.status(200).json({ token, updatedUser });
  } catch (error) {
    res.status(500).json(error);
  }
};


// if (req.files && req.files.image) {
// try {
//   const uploadedImage = req.files.image as UploadedFile;
//   const base64Data = `data:${uploadedImage.mimetype};base64,${uploadedImage.data.toString("base64")}`;

//   // Upload an image
//   const uploadResult = await cloudinary.v2.uploader.upload(base64Data, {
//     folder: "user_images", // Optional: specify a folder in your Cloudinary account
//   });

//   console.log(uploadResult);
//   user.image = uploadResult.secure_url; // Assuming you want to store the image URL in your user document
// } catch (error) {
//   console.log(error);
//   res.status(500).json({ message: "Image upload failed", error });
//   return;
// }
// }

// // https://chatgpt.com/c/ec2c1b94-fa7a-4b41-ac7f-76c4a587c6c6

// // https://console.cloudinary.com/pm/c-b9e19ca2749732b91448766c3fd435/getting-started

// // Upload an image
// const uploadResult = await cloudinary.uploader.upload(
//   `data:image/jpeg;base64,${uploadedImage.data.toString("base64")}`,
//   {folder: "user_images"},
// );

// console.log(uploadResult);
