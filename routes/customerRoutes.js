import express from "express";
import { createCart, getCarts, editCart, deleteCart } from "../controllers/cartControllers.js"
import { addReview, fetchImages, fetchVendors, getAllProducts, getAllReviews, getSingleProduct } from "../controllers/productControllers.js";
import { addToWishlist, allWishLists, deleteWishList } from "../controllers/wishlistControllers.js";
import verifyJWT from "../middleware/authMiddleware.js";
import { addShippingInfo, getShippingInfo } from "../controllers/shippingControllers.js";
import { checkoutPayment } from "../controllers/checkoutController.js";
import { getInvoice } from "../controllers/invoiceControllers.js";
import { getOrdersOfCustomer, trackOrder } from "../controllers/orderControllers.js";
const router = express.Router();
// cart routes 
router.post("/cart/:productId", verifyJWT, createCart)
router.get("/carts", verifyJWT, getCarts)
router.put("/cart/:cartId", verifyJWT, editCart)
router.delete("/cart/:cartId", verifyJWT, deleteCart)
// product routes
router.get("/products", verifyJWT, getAllProducts)
router.get("/products/vendor", verifyJWT, fetchVendors)
router.get("/product/:productId", verifyJWT, getSingleProduct)
router.post("/product/:productId", verifyJWT, addReview)
router.get("/reviews/:productId", getAllReviews)
router.get("/home", verifyJWT, fetchImages)
//wishlist routes
router.post("/wishlist/:productId", verifyJWT, addToWishlist)
router.get("/wishlist", verifyJWT, allWishLists)
router.delete("/wishlist/:productId", verifyJWT, deleteWishList)
//shipping Info routes 
router.post("/shipping-info", verifyJWT, addShippingInfo)
router.get("/shipping-info", verifyJWT, getShippingInfo)
//checkout routes
router.post("/checkout", verifyJWT, checkoutPayment)
// invoice routes
router.get("/invoice/:invoiceId", verifyJWT, getInvoice)
//orders routes
router.get("/orders", verifyJWT, getOrdersOfCustomer)
router.get("/order/:orderId", trackOrder)

export default router;