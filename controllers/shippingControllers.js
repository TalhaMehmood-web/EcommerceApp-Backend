import ShippingInfo from "../models/ShippingModel.js";
import asyncHandler from "express-async-handler";


export const addShippingInfo = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(403).json({ message: "User not found!" })
        }
        const { fullName, email, phoneNumber, addressLineOne, addressLineTwo, postalCode, country, city } = req.body;

        const findShippingData = await ShippingInfo.findOne({ user: userId })
        if (findShippingData) {
            return res.status(400).json({ message: "Your Shipping Info Already Added" })
        }
        const shippingData = await ShippingInfo.create({
            user: userId,
            fullName,
            email,
            phoneNumber,
            address: {
                addressLineOne: req.body.address.addressLineOne,
                addressLineTwo: req.body.address.addressLineTwo || "",
            },
            location: {
                country: req.body.location.country,
                city: req.body.location.city,
                postalCode: req.body.location.postalCode,
            }
        })
        if (!shippingData) {
            return res.status(500).json({ message: "Something went wrong!" })
        }
        res.status(201).json(shippingData)
    } catch (error) {
        console.log(error);
        res.status(500).jsonp({ message: error?.message })
    }
})
export const getShippingInfo = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(400).json({ message: "User not found!" })
        }
        const findShippingInfo = await ShippingInfo.findOne({ user: userId })
        if (!findShippingInfo) {
            return res.status(404).json({ message: "Shipping info not found" })
        }
        res.status(200).json({ _id: findShippingInfo?._id, name: findShippingInfo?.fullName, address: findShippingInfo?.address?.addressLineOne, phoneNumber: findShippingInfo?.phoneNumber })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})