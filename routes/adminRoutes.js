import express from "express";
import { createProduct, deleteProduct, editProduct, listProducts } from "../controllers/productControllers.js";
import { createCategory, getCategories } from "../controllers/categoryController.js";
import verifyJWT from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multerMiddleware.js";
import { AllOrders, allCustomers, getSingleAdminOrder } from "../controllers/orderControllers.js";

const router = express.Router();

//Product routes
router.post("/product", verifyJWT, upload.single("productPicture"), createProduct)
router.get("/products", verifyJWT, listProducts)
router.post("/category", verifyJWT, createCategory)
router.get("/category", verifyJWT, getCategories)
router.put("/edit-product/:productId", verifyJWT, editProduct)
router.delete("/delete-product/:productId", verifyJWT, deleteProduct)
// orders routes
router.get("/orders", verifyJWT, AllOrders)
router.get("/all-customers", verifyJWT, allCustomers)
router.get("/order", verifyJWT, getSingleAdminOrder)


export default router;