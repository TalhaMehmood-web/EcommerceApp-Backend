import Product from "../models/productModel.js"
import mongoose from "mongoose";
import User from "../models/userModel.js"
import Category from "../models/categoryModel.js";
import asyncHandler from "express-async-handler";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { io } from "../socket/socket.js";
export const createProduct = asyncHandler(async (req, res) => {
    try {
        const { title, description, category, regularPrice, salesPrice, shippingType, deliveryType, vendor, stockQuantity, offer, collections, tags } = req.body;

        const userId = req.user?._id;
        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }
        const findCategory = await Category.findOne({ name: category });
        if (!findCategory) {
            return res.status(404).json({ message: "Category not found!!" })
        }
        const pictureLocalPath = req.file.path;

        if (!pictureLocalPath) {
            return res.status(400).json({ message: "file path not found" })
        }
        const picture = await uploadOnCloudinary(pictureLocalPath);
        const product = await Product.create({
            title,
            description,
            picture: picture?.url || "",
            category: findCategory?._id,
            categoryTitle: category,
            regularPrice,
            salesPrice,
            shippingType,
            deliveryType,
            vendor,
            stockQuantity,
            offer,
            collections,
            tags,
            createdBy: userId
        })
        await product.save()
        if (product) {
            return res.status(201).json(product);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message })
    }
})

export const editProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const fieldsToUpdate = req.body
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: "Product not found!!" })
        }
        const updatedProduct = await Product.findByIdAndUpdate(productId, { $set: fieldsToUpdate }, { new: true })
        if (updatedProduct) {
            return res.status(201).json({ updatedProduct, message: "Product updated Successfully" })
        }

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: "Product not found!!" })
        }

        const deletedProduct = await Product.findByIdAndDelete(productId)
        if (deletedProduct) {
            return res.status(203).json({ message: "Product deleted Successfully" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const listProducts = async (req, res) => {
    try {
        const adminId = req.user?._id;

        const products = await Product.aggregate([
            {
                $match: {
                    createdBy: adminId
                }
            }, {
                $project: {
                    _id: 1,
                    title: 1,
                    picture: 1,
                    salesPrice: 1,
                    categoryTitle: 1,
                    tags: 1,
                    vendor: 1,
                    createdAt: 1,
                }
            }
        ])
        if (products.length === 0) {
            return res.status(404).json({ message: "No Data Found!!" })
        }
        res.status(200).json(products)
    } catch (error) {
        res.status(500).json({ message: error?.message })
    }
}
export const getAllProducts = asyncHandler(async (req, res) => {
    try {
        let categories = req.query.categories;
        let vendors = req.query.vendors;

        // Parse categories as an array
        if (typeof categories === 'string') {
            categories = JSON.parse(categories);
        }
        if (typeof vendors === 'string') {
            vendors = JSON.parse(vendors);
        }
        let filter = {};

        // If categories array is provided, filter products based on categories
        if (categories && categories.length > 0) {
            filter.categoryTitle = { $in: categories };
        }

        // If vendors array is provided, filter products based on vendors
        if (vendors && vendors.length > 0) {
            filter.vendor = { $in: vendors };
        }
        // Find products based on the filter
        const products = await Product.find(filter).sort({ createAt: 1 });

        if (products.length === 0) {
            return res.status(404).json({ message: "Products not found!!" });
        }

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
export const fetchVendors = asyncHandler(async (req, res) => {
    try {
        const vendors = await Product.aggregate([
            {
                $group: {
                    _id: "$vendor" // Group by the vendor field
                }
            },
            {
                $project: {
                    _id: 1, // Exclude the default _id field
                    name: "$_id" // Rename _id as vendor
                }
            }
        ]);
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})


// fetch single product by id 
export const getSingleProduct = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({ message: "product not found" })
        }
        res.status(200).json(product)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
//review
export const addReview = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user?._id;
        const customer = await User.findById(userId)
        const review = {
            rating: req.body.review.rating,
            comment: req.body.review.comment,
            reviewedBy: userId,
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found!" })
        }
        const isReviewed = product.reviews.find(
            (rev) => rev.reviewedBy.toString() === userId.toString()
        );
        if (isReviewed) {
            return res.status(400).json({ message: "You have already reviewed this product" })
        }
        product.reviews.push(review);
        io.emit("review", {
            _id: new mongoose.Types.ObjectId(),
            rating: req.body.review.rating,
            comment: req.body.review.comment,
            reviewedBy: {
                _id: customer._id,
                fullname: customer.fullname,
                picture: customer.picture
            },
            createdAt: Date.now()
        })
        await product.save();
        res.status(200).json({ message: "Review added successfully" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
export const getAllReviews = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;

        const productReviews = await Product.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(productId)
                }
            },
            {
                $unwind: "$reviews"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "reviews.reviewedBy",
                    foreignField: "_id",
                    as: "reviews.reviewedBy"
                }
            },
            {
                $addFields: {
                    "reviews.reviewedBy": {
                        $arrayElemAt: ["$reviews.reviewedBy", 0]
                    }
                }
            },
            {
                $sort: {
                    "reviews.createdAt": -1
                }
            },
            {
                $project: {
                    _id: "$reviews._id",
                    rating: "$reviews.rating",
                    comment: "$reviews.comment",
                    createdAt: "$reviews.createdAt",
                    reviewedBy: {
                        _id: "$reviews.reviewedBy._id",
                        fullname: "$reviews.reviewedBy.fullname",
                        picture: "$reviews.reviewedBy.picture"
                    }
                }
            }
        ]);

        res.status(200).json(productReviews);
    } catch (error) {
        res.status(500).json({ message: error?.message });
    }
});
export const fetchImages = asyncHandler(async (req, res) => {
    try {
        const images = await Product.aggregate([
            {
                $project: {
                    title: 1,
                    picture: 1
                }
            }
        ])
        res.status(200).json(images)
    } catch (error) {

    }
})