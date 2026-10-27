import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { toggleVideoLike, toggleTweetLike, toggleCommentLike, getLikedVideos } from "../controllers/like.controller.js";

const router = Router();

router.route("/toggle/v/:videoId")
.patch(verifyJWT, toggleVideoLike)

router.route("/toggle/c/:commentId")
.patch(verifyJWT, toggleCommentLike)

router.route("/toggle/t/:tweetId")
.patch(verifyJWT, toggleTweetLike)

router.route("/likedVideos")
.get(verifyJWT, getLikedVideos)

export default router