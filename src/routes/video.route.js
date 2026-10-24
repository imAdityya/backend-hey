import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { uploadVideo, deleteVideo, getAllVideos } from "../controllers/video.controller.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]),
  uploadVideo
);

router.route("/delete").post(verifyJWT, deleteVideo)

router.route("/").get(getAllVideos)

export default router;