import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { toggleSubscription, channelSubscribers, userSubscriptions } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/:channelId")
.post(verifyJWT, toggleSubscription)
.get(channelSubscribers)

router.route("/")
.get(verifyJWT, userSubscriptions)


export default router