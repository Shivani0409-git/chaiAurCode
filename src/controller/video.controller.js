import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/videos.models.js";
import {User} from "../models/users.models.js";
import {ApiError} from "../utils/apiError.js";
import {ApiResponses} from "../utils/apiResponses.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
//import {jwt} from "../utils/jwt.js";
import {mongoose, isValidObjectId} from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
	if(userId && !isValidObjectId(userId)){
		throw new ApiError(400, "Invalid user id");
	}

	const videos = await User.aggregate([
		{
			$match: {
				_id: userId
			}
		},
		{
			$lookup: {
				from: "videos",
				localField: "_id",
				foreignField: "owner",
				as: "videos"
			}
		}
	])

	return res.status(200).json(new ApiResponses(200, videos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
	if(!req.files || !req.files.videoFile || !req.files.thumbnail){
		throw new ApiError(400, "Video file and thumbnail are required");
	}
	const videoFile = req.files.videoFile[0];
	const thumbnail = req.files.thumbnail[0];
	const videoUploadResult = await uploadOnCloudinary(videoFile.path, {
		resource_type: "video",
		public_id: `${Date.now()}-${videoFile.originalname}`,
		overwrite: true,
		folder: "videos",
		quality: "auto",
	});
	const thumbnailUploadResult = await uploadOnCloudinary(thumbnail.path, {
		resource_type: "image",
		public_id: `${Date.now()}-${thumbnail.originalname}`,
		overwrite: true,
		folder: "thumbnails",
		quality: "auto",
	});
	const video = await Video.create({
		video: videoUploadResult.secure_url,
		thumbnail: thumbnailUploadResult.secure_url,
		title,
		description,
		owner: req.user._id
	})
	return res.status(201).json(new ApiResponses(201, "Video published successfully", video));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

	if(!videoId){
		throw new ApiError(400, "Video id is required");
	}

	const video = await User.aggregate([
		{
			$match: {
				_id: videoId
			}
		},
		{
			$lookup: {
				from: "videos",
				localField: "_id",
				foreignField: "owner",
				as: "videos"
			}
		}
	])
	if(!video || video.length === 0){
		throw new ApiError(404, "Video not found");
	}

	return res.status(200).json(new ApiResponses(200, video, "Video fetched successfully"));
})
/** 
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})
***/
export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    // updateVideo,
    // deleteVideo,
    // togglePublishStatus
}