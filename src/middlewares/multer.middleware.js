import multer from "multer";

const storage = multer.diskStorage({
  destinatin: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({storage})