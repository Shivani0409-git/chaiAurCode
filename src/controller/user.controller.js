import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/users.models.js";
import {ApiResponses} from "../utils/apiResponses.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId)=> {
        try {
                const user = await User.findById(userId)
                const accessToken = user.generateAccessToken()
                const refreshToken = user.generateRefreshToken()

                user.refreshToken = refreshToken

                await user.save({validateBeforeSave: false})

                return {accessToken, refreshToken};

        } catch (error) {
                throw new ApiError(500, "Something went wrong while generating tokens");
        }
}

const registerUser = asyncHandler(async (req, res)=>{

        //get details from req.body(frontend)
        //validate (ex not empty
        //check user exists or not
        //check files (avatar, coverImage)
        //upload files to cloudinary, avatr is required so check for that
        //create user in db (in object form)
        //check user created or not
        //remove password, refreshTokens from user object
        //send response to frontend

        // res.status(200).json({
        //         message: "User registered successfully"
        // })

        // http://localhost:8000/api/v1/users/register


        const {fullname, email, username, password} = req.body;
        console.log("User Data:", {fullname, email, username, password});

        if([fullname, email, username, password].some((fields)=> fields?.trim() === "")){
                throw new ApiError(400, "All fields are required");
        }
        

        const existedUser = await User.findOne({
                $or: [{username},{email}]
        })
        
        if(existedUser){
                throw new ApiError(409, "Username or email already exists");
        }

          const avatarLocalPath = req.files?.avatar[0]?.path;
        //   const coverImageLocalPath = req.files?.coverImage[0]?.path;    //error(it indicates that coverImage is undefined if not uploaded)

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
                coverImageLocalPath = req.files.coverImage[0].path
        }
          
        //console.log("Uploaded :", avatarLocalPath, coverImageLocalPath);

        if(!avatarLocalPath){
                throw new ApiError(400, "Avtar image is required");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        console.log("Uploaded Files:", avatar, coverImage);

        if (!avatar) {
            throw new ApiError(400, "Avatar file is required")
        }

    
        const user = await User.create({
                fullname,
                avatar: avatar.url,
                coverImage: coverImage?.url||"",
                email,
                username: username.toLowerCase(),
                password
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if(!createdUser){
                throw new ApiError(500, "User registration failed");
        }

        return res.status(201).json(
                new ApiResponses(200, "User registered successfully", createdUser)
        )

    }
)

const loginUser = asyncHandler(async (req, res)=>{
        //req.body => data
        // username, email login
        //find user 
        //password check
        //if pass, generate AT, RT
        //send cookies

//         {
//     "email":"shiv@gmail.com",
//     "password":"123"
//          }

        const {username, email, password} = req.body;
        console.log("Login Data:", {username, email, password})

        if(!username && !email){
                throw new ApiError(404,"username or email is required");
        }

        // if(!(username || email)){
        //         throw new ApiError(404,"username or email is required");
        // }

        const user = await User.findOne({
                $or: [{username}, {email}]
        })
        if(!user){
               throw new ApiError(404, "User not found"); 
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if(!isPasswordValid){
                throw new ApiError(401, "Invalid password");
        }
       

        
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


        const options = {
                httpOnly: true,
                secure: true
        }

        return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json( 
                        new ApiResponses(
                                200, 
                                { user: loggedInUser, accessToken, refreshToken},
                                "User logged In Successfully"
                        ) 
                )

})

const logoutUser = asyncHandler(async (req, res)=>{
        // remove cookies and tokens from db
        await User.findByIdAndUpdate(
                req.user._id, 
                {
                //     $set: {
                //        refreshToken: undefined 
                // this removes the field from document
                //       }
                       $unset: { refreshToken: 1 }  // this removes the field from document
                },
                {
                        new: true
                }
        )

        const options = {
                httpOnly: true,
                secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json( new ApiResponses(200, {}, "User logOut successfully") )

})

const refreshAccessToken = asyncHandler(async(req, res) => {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
                throw new ApiError(401,"**Unautherized** incomingRefreshToken");
        }

        const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if(!user){
                throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
                httpOnly: true,
                secure:true
        }

        const {accessToken, newRefreshToken} = generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
                new ApiResponses(
                        200,
                        {
                                accessToken, refreshToken:newRefreshToken
                        },
                        "access Token Refreshed"

                )
        )
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
        const {oldPassword, newPassword} = req.body

        // const {oldPassword, newPassword, confPassword} = req.body
        // if(!newPassword==confPassword){}

        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
                throw new ApiError(400, "Invalid old password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave: false})

        return res
        .status(200)
        .json(new ApiResponses(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=> {
        return res
        .status(200)
        .json(new ApiResponses(200, req.user, "current user fetched successfully "))
})

const updateAccountDetails= asyncHandler(async(req,res)=>{
        const {fullName, email} = req.body

        if(!fullName || !email){
                throw new ApiError(400, "All fields are require")
        }

        const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                        $set:{
                                fullName,
                                email:email
                        }
                },
                {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponses(200, user, "Account details update successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
        const avatarLocalPath = req.file?.path
        if(!avatarLocalPath){
                throw new ApiError(400, "Avatar file is missing")
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if(!avatar.url){
                throw new ApiError(400, "Error while uploading on avatar")
        }

        const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                        $set:{
                                avatr:avatar.url
                        }
                },
                {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(
                new ApiResponses(200, user, "Avatar image updated successfully")
        )
})

const updateCoverImage = asyncHandler(async(req, res)=>{
        const coverImageLocalPath = req.file?.path
        if(!coverImageLocalPath){
                throw new ApiError(400, "coverImage file is missing")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!coverImage.url){
                throw new ApiError(400, "Error while uploading on coverImage")
        }

        const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                        $set:{
                                coverImage:coverImage.url
                        }
                },
                {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(
                new ApiResponses(200, user, "Cover image updated successfully")
        )

})

const getUserchannelProfile=asyncHandler(async(req,res)=>{
        const {username} = req.params
        if(!username.trim()){
                throw new ApiError(400,"username is missing")
        }
        const channel = await User.aggregate([
                {
                        $match:{username:username?.toLowerCase()}
                },
                {
                        $lookup:{
                                from:"subscriptions",
                                localField:"_id",
                                foreignField:"channel",
                                as:"subscribers"
                        }
                },
                {
                        $lookup:{
                                from:"subscriptions",
                                localField:"_id",
                                foreignField:"sunscriber",
                                as:"subscribedTo"
                        }
                },
                {
                        $addFields:{
                                subscribersCount:{$size:"$subscribers"},
                                channelSubscribedToCount:{$size:"$subscribedTo"},
                                isSubscribed:{
                                        $cond:{
                                                if:{$in:[req.user?._id, "$subscribers.sunscriber"]},
                                                then:true,
                                                else:false
                                        }
                                }
                        }
                },
                {
                        $project:{
                                fullname:1,
                                username:1,
                                email:1,
                                avatar:1,
                                coverImage:1,
                                subscribersCount:1,
                                channelSubscribedToCount:1,
                                isSubscribed:1                                
                        }
                }                
        ])
        if(!channel?.length){
                throw new ApiError(404, "Channel does not exist")
        }
        return res
        .status(200)
        .json(
                new ApiResponses(200, channel[0], "Channel profile fetched successfully")
        )
})

const getWatchedHistory = asyncHandler(async(req,res)=>{
        // req.user._id => it gives string but we need objectId so convert it to objectId
        const user = await User.aggregate([
                {
                        $match:{_id: new mongoose.Types.ObjectId(req.user?._id)}
                },
                {
                        $lookup:{
                                from:"videos",
                                localField:"watchedHistory",
                                foreignField:"_id",
                                as:"watchedHistory",
                                pipeline:[
                                        {
                                                $lookup:{
                                                        from:"users",
                                                        localField:"owner",
                                                        foreignField:"_id",
                                                        as:"owner",
                                                        pipeline:[
                                                                {
                                                                        $project:{
                                                                                fullname:1,
                                                                                username:1,
                                                                                avatar:1
                                                                        }
                                                                }
                                                        ]
                                                }
                                        },
                                        {
                                                $addFields:{
                                                        owner:{
                                                                $first:"$owner"
                                                        }
                                                }
                                        }
                                ]
                        }
                }
        ])
        return res
        .status(200)
        .json(
                new ApiResponses(200, user[0]?.watchedHistory || [], "Watched history fetched successfully")
        )
})

export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateCoverImage,
        getUserchannelProfile,
        getWatchedHistory
};