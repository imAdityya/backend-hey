import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { uploadVideo, deleteVideo, getAllVideos, getVideoById, updateVideoDetails, togglePublishStatus } from "../controllers/video.controller.js";

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


router.route("/").get(getAllVideos)
//videos?page=1&limit=10


router.route("/:videoId")
  .get(getVideoById)
  .patch(verifyJWT, upload.single("thumbnail"),updateVideoDetails)
  .delete(verifyJWT, deleteVideo)

router.route("/change_publish_status/:videoId")
  .patch(verifyJWT, togglePublishStatus)

export default router;