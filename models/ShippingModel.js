import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    address: {
        addressLineOne: {
            type: String,
            required: true,
        },
        addressLineTwo: {
            type: String,
            // required: true
        },
    },
    location: {
        country: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        }
    }
})
const ShippingInfo = mongoose.model("ShippingInfo", shippingSchema)
export default ShippingInfo;