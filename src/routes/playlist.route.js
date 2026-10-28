import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createPlaylist, addVideo, removeVideo } from "../controllers/playlist.controller.js";

const router = Router();

router.route("/")
.post(verifyJWT, createPlaylist)

router.route("/:playlistId/:videoId")
.patch(verifyJWT, addVideo)
.delete(verifyJWT, removeVideo)

export default router