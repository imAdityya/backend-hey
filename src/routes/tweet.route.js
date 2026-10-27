import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createTweet, updateTweet, deleteTweet, getUserTweets } from "../controllers/tweet.controller.js";

const router = Router();

router.route("/:tweetId")
.post(verifyJWT, createTweet)
.patch(verifyJWT, updateTweet)
.delete(verifyJWT, deleteTweet)

router.route("/:")
.get(getUserTweets)

export default router