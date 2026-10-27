import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { addComment, updateComment, deleteComment, getVideoComments } from "../controllers/comment.controller.js";

const router = Router();

router.route("/:videoId")
  .post(verifyJWT, addComment)
  .get(getVideoComments)

router.route("/:commentId")
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment)
export default router;