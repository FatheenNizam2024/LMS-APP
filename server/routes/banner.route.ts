import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import { uploadBannerImage, getBannerImages, deleteBannerImage } from "../controllers/banner.controller";

const bannerRouter = express.Router();

// Admin routes
bannerRouter.post("/upload-banner", isAutheticated, authorizeRoles("admin"), uploadBannerImage);
bannerRouter.delete("/delete-banner/:id", isAutheticated, authorizeRoles("admin"), deleteBannerImage);

// Public route for the client app
bannerRouter.get("/get-banners", getBannerImages);

export default bannerRouter;