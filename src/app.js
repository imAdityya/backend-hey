import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({limit: "16kb"}));

// handle spaces in url e.g. %20, +
app.use(express.urlencoded({extended: true, limit: '16kb'}));

//public files for that anyone can access
app.use(express.static("public"));

app.use(cookieParser());

//routes import

import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import tweetRouter from './routes/tweet.route.js';
import likeRouter from './routes/like.route.js';
import playlistRoute from './routes/playlist.route.js';
import subcriptionRoute from './routes/subscription.route.js'

//routes declration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRoute);
app.use("/api/v1/subscriptions", subcriptionRoute);

//http://localhost:8000/api/v1/users/register



export { app }