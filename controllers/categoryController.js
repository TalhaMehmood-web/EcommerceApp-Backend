import asyncHandler from "express-async-handler"
import Category from "../models/categoryModel.js"
export const createCategory = asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Category Name is required" })
        }
        const category = await Category.create({
            name,
        })
        res.status(201).json(category)
    } catch (error) {
        res.status(500).json({ message: error.messages })
    }
})
export const getCategories = asyncHandler(async (_, res) => {
    try {
        const categories = await Category.aggregate([
            {
                $project: {
                    _id: 1,
                    name: 1
                }
            }
        ])
        if (categories.length === 0) {
            return res.status(404).json({ message: "Categories not found!!" })
        }
        res.status(200).json(categories)
    } catch (error) {
        res.status(500).json({ message: error?.message })
    }
})