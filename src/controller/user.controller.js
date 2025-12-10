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
                    $set: {
                       refreshToken: undefined // this removes the field from document
                      }
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

export {
        registerUser,
        loginUser,
        logoutUser
};