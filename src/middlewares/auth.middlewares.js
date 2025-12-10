import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";


export const VerifyJwt = asyncHandler(async (req, res, next) => {
    // get token from headers

    try {
        const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");
    
        if(!token){
            throw new ApiError(402, "Something went wrong. To get token");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.getById(decodedToken?.userId).select("-password -refreshTokens");
    
        if(!user){
            throw new ApiError(401, "Unauthorized access");
        }
    
        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "something went wrong to verify jwt");
    }

})