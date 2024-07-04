import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import fileUpload from "express-fileupload";
import session from "express-session";

import users from "./routes/users.routes";
import friends from "./routes/friends.routes";
import postsRoute from "./routes/posts.routes";
import comment from "./routes/comment.routes";
import notification from "./routes/notification.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(fileUpload());

// app.use(fileUpload({
//   useTempFiles: true
// }));

app.use(
  session({
    secret: "changeit",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 600000 },
  })
);

app.use("/users", users);
app.use("/friends", friends);
app.use("/post", postsRoute);
app.use("/comment", comment);
app.use("/notification", notification);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `404 route not found`,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: `500 Something broken!`,
    error: err.message,
  });
});

export default app;
