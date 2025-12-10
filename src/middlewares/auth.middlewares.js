import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";


export const VerifyJwt = asyncHandler(async (req, _, next) => {
    // get token from headers

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(402, "Something went wrong. To get token");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Invalid access Token");
        }
    
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "something went wrong to verify jwt");
    }

})