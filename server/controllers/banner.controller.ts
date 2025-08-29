import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import BannerImageModel from "../models/banner.model";
import { minioClient } from "../utils/minioClient";
import imageSize from 'image-size'; // Import the new library

const BUCKET_NAME = 'lms-banners'; // Dedicated bucket for banners

// Upload a new banner image
export const uploadBannerImage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = req.body.image; // Expecting a base64 string
      if (!image) {
        return next(new ErrorHandler("No image provided", 400));
      }

      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      const dimensions = imageSize(new Uint8Array(buffer));
      if (!dimensions.width || !dimensions.height) {
          return next(new ErrorHandler("Could not determine image dimensions.", 400));
      }
      const objectName = `banner-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      await minioClient.putObject(BUCKET_NAME, objectName, buffer);

      const bannerImage = await BannerImageModel.create({
        public_id: objectName,
        bucket: BUCKET_NAME,
        width: dimensions.width,  // Save the width
        height: dimensions.height, // Save the height
      });

      res.status(201).json({
        success: true,
        bannerImage,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all banner images with presigned URLs
export const getBannerImages = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bannerImagesFromDB = await BannerImageModel.find().sort({ createdAt: -1 }).lean();

      const bannerImagesWithUrls = await Promise.all(
        bannerImagesFromDB.map(async (image) => {
          // 1. Get the path and query parameters from the client (path only)
          const url = await minioClient.presignedGetObject(
            image.bucket,
            image.public_id,
            7 * 24 * 60 * 60
          );
          return { ...image, url };
        })
      );

      res.status(200).json({
        success: true,
        bannerImages: bannerImagesWithUrls,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete a banner image
export const deleteBannerImage = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const bannerImage = await BannerImageModel.findById(id);

      if (!bannerImage) {
        return next(new ErrorHandler("Banner image not found", 404));
      }

      await minioClient.removeObject(bannerImage.bucket, bannerImage.public_id);
      await bannerImage.deleteOne();

      res.status(200).json({
        success: true,
        message: "Banner image deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);