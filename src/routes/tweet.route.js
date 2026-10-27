import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createTweet, updateTweet, deleteTweet, getUserTweets, getTweets } from "../controllers/tweet.controller.js";

const router = Router();

router.route("/")
.get(getTweets)
.post(verifyJWT, createTweet)

router.route("/:userId")
.get(getUserTweets)

router.route("/:tweetId")
.patch(verifyJWT, updateTweet)
.delete(verifyJWT, deleteTweet)


export default router