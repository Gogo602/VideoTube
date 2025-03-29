import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
    
        if (!user) {
            throw new ApiError(402, "User Does not exist")
        }
        const accessToken = user.generateAccesToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refrsh tokens")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body
    
    //validation
    if (
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImage)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Upload avatar", avatar)
    } catch (error) {
        console.log("error uploading avatar", error)
         throw new ApiError(500, "Failed to upload Avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("Upload coverImage", coverImage)
    } catch (error) {
        console.log("error uploading coverImage", error)
         throw new ApiError(500, "Failed to upload coverImage")
    }

    try {
        const user = await User.create({
            fullname, 
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        })
    
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
    
        if (!createdUser) {
            throw new ApiError (500, "something went wrong while registering a user")
        }
        return res
            .status(201)
        .json(new ApiResponse(200, createdUser, "User registered succesfully"))
    } catch (error) {
        console.log("User creation failed")
        
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError (500, "something went wrong while registering and user images where deleted")
    }

})

const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const { email, username, password } = req.body 
    

    //validation
    if (!email && !username) {
        throw new ApiError(400, "email or username is required")
    }
     if (!password) {
        throw new ApiError(400, "password is required")
    }

     const user = await User.findOne({
        $or : [{username}, {email}]
    })
    if (!user) {
         throw new ApiError(404, "user not found")
    }
    
    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    const {accessToken,  refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id)
        .select("-password, -refreshToken");
    
    if (!loggedInUser) {
        throw new ApiError(401, "user doesnot exist")
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
           "user logged in successfully"
        ))
    
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
               refreshToken: undefined,
           }
        },
       {new: true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res
        .status(200)
        .clearCookie("accesstoken", options)
        .clearCookie("refreshToken", options)
        .json( new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => 
{
    const incomingRefreshToken = req - cookies.refreshToken || 
        req.body.refreshToken
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,

        )
        const user = await User.findById(decodedToken?._id)
        
        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        const options = {
            httpOnly: true,
            secure: process.NODE_ENV === "production",
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshToken(user._id)
        
        return res
            .status(200)
            .cookies("accessToken", accessToken, options)
            .cookies("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token refreshed successfully"));

    } catch (error) {
        throw new ApiError(500, "something went wrong while refreshing access token")
    }
})

const ChangeCurrentPassword = asyncHandler(async (req, res) => 
{ 
    const { oldPassword, newPassword } = req.body
    
    const user = await User.findById(req.user?._id)

    user.isPasswordValid = await user.isPasswordCorrect
        (oldPassword)
    
    if (!isPasswordValid) {
        throw new ApiError(401, "old password is incorrect")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })
    
    return res.status(200).json( new ApiResponse (200, {}, "Password changed successfully"))


})

const getCurrentUser = asyncHandler(async (req, res) => 
{ 
    return res.status(200).json( new ApiResponse (200, req.user, "Current user details"))
})

const updateAccountDetails = asyncHandler(async (req, res) => 
{ 
    const { fullname, email } = req.body
    
    if (!fullname && !email){
        throw new ApiError(400, "Fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json( new ApiResponse (200, user, "Account details Updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => 
{ 
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "File is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    
    if (!avatar.url) {
        throw new ApiError(500, "something went wrong while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json( new ApiResponse (200, user, "Avatar Updated successfully"))
})


const updateUsercoverImage = asyncHandler(async (req, res) => 
{ 
     const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "File is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!coverImage.url) {
        throw new ApiError(500, "something went wrong while uploading the CoverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res.status(200).json( new ApiResponse (200, user, "CoverImage Updated successfully"))
})



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    ChangeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUsercoverImage
}