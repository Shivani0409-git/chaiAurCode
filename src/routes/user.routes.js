import { Router } from "express";
import { logoutUser, loginUser, registerUser } from "../controller/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { VerifyJwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(
    VerifyJwt,
    logoutUser);

export default router;