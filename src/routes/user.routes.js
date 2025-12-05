import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avtar",
            maxCount: 1
        },
        {
            name: "coverPhoto",
            maxCount: 1
        }
    ]),
    registerUser);

export default router;