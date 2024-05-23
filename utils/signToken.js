import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
const generateToken = (_id, isAdmin, secretKey, expiry) => {
    const payload = {
        _id,
        isAdmin,
    }

    return jwt.sign(payload, secretKey, { expiresIn: expiry })
}

export const generateAccessAndRefreshTokens = async (userId, isAdmin, _, res) => {
    try {
        const user = await User.findById(userId)
        const accessToken = generateToken(userId, isAdmin, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRY)
        const refreshToken = generateToken(userId, isAdmin, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRY)

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        res.status(500).json({ message: "Something went wrong while generating refresh and access token", message2: error.message })
    }
}