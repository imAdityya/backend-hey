import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { createPlaylist, addVideo, removeVideo, deletePlaylist, updatePlaylist, userPlaylists, playlistById } from "../controllers/playlist.controller.js";

const router = Router();

router.route("/")
.post(verifyJWT, createPlaylist)
.get(verifyJWT, userPlaylists)

router.route("/:playlistId/:videoId")
.patch(verifyJWT, addVideo)
.delete(verifyJWT, removeVideo)

router.route("/:playlistId")
.get(playlistById)
.delete(verifyJWT, deletePlaylist)
.patch(verifyJWT, updatePlaylist)

export default router