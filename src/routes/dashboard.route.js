import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller.js';

const router = Router();

router.route("/videos/:channelId")
.get(getChannelVideos)

router.route("/channel/:channelId")
.get(getChannelStats)

export default router