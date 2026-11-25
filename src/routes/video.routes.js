import Router from 'express';
import {upload} from "../middlewares/multer.middlewares.js";
import { VerifyJwt } from "../middlewares/auth.middlewares.js";
import {
	getAllVideos, 
	getVideoById,
	// updateVideo,
	// deleteVideo,
	// togglePublishStatus,
	publishAVideo
} from "../controller/video.controller.js";
 
const router = Router();

router.use(VerifyJwt);

router
    .route("/").get(getAllVideos)
	.post(upload.fields([
		{
			name: "videoFile",
			maxCount: 1
		},
		{
			name: "thumbnail",
			maxCount: 1
		}
	]), publishAVideo);

router
    .route("/:videoId")
    .get(getVideoById);

// router
// 	.route("/toggle/publish/:videoId")
// 	.patch(togglePublishStatus);

export default router;