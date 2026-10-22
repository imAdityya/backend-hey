import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express"; 

const router = Router();

router.route("/upload").post(
  upload.field()
)

export default router