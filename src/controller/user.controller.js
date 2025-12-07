import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/users.models.js";
import {ApiResponses} from "../utils/apiResponses.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res)=>{
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
        //   const coverImageLocalPath = req.files?.coverImage[0]?.path;    //error

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
                coverImageLocalPath = req.files.coverImage[0].path
        }
          
console.log("Uploaded :", avatarLocalPath, coverImageLocalPath);

        if(!avatarLocalPath){
                throw new ApiError(400, "Avtar image is required");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        console.log("Uploaded Files:", avatar, coverImage);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    
        const user = await User.create(
                {
                   fullname,
                   avatar: avatar.url,
                   coverImage: coverImage?.url||"",
                   email,
                   username: username.toLowerCase(),
                   password
                }
        )

        const createdUser = await User.findById(user._id).select("-password -refreshTokens");

        if(!createdUser){
                throw new ApiError(500, "User registration failed");
        }

        return res.status(201).json(
                new ApiResponses(200, "User registered successfully", createdUser)
        )

    }
)

export {registerUser};