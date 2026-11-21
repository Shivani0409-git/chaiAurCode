import { Router } from "express";
import { 
    logoutUser, 
    loginUser, 
    registerUser, 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    udateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserchannelProfile,
    getWatchHistory
 } from "../controller/user.controller.js";
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

router.route("/refreshToken").post(refreshAccessToken)
router.route("/change-password").post(VerifyJwt, changeCurrentPassword)
router.route("/current-user").get(VerifyJwt, getCurrentUser)
router.route("/update-account").patch(VerifyJwt, udateAccountDetails)
router.route("/avatar").patch(VerifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(VerifyJwt, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJwt, getUserchannelProfile)
router.route("/history").get(VerifyJwt, getWatchHistory)

export default router;