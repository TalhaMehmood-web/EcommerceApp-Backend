import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,

    },
    picture: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },

    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: String,
        default: null
    },
    refreshToken: {
        type: String
    }
})


const schema = mongoose.model("User", userSchema)
export default schema;