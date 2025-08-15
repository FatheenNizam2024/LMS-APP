// C:\Lms-App - Copy\server\controllers\course.controller.ts

import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import CourseModel, { IResource } from "../models/course.model";
import { redis } from "../utils/redis";
import axios from 'axios';
import { getAllCoursesService } from "../services/course.service";
import mime from "mime-types";
import https from 'https';
import jwt, { JwtPayload } from "jsonwebtoken";
import userModel from "../models/user.model";
import { IncomingMessage } from "http";


const uploadImageFile = (file: string, folder: string): Promise<{ public_id: string; url: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      file, { folder, resource_type: 'image' }, (error, result) => {
        if (result) {
          resolve({ public_id: result.public_id, url: result.secure_url });
        } else {
          reject(error || new Error("Cloudinary image upload failed."));
        }
      }
    );
  });
};

const uploadFile = (file: string, folder: string): Promise<{ public_id: string; url: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      file,
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed."));
        }

        let finalUrl = result.secure_url;
        
        if (result.resource_type === 'raw') {
          finalUrl = finalUrl.replace('/image/upload/', '/raw/upload/fl_attachment/');
        }
        
        resolve({
          public_id: result.public_id,
          url: finalUrl,
        });
      }
    );
  });
};

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      if (data.thumbnail && data.thumbnail.startsWith("data:")) {
        data.thumbnail = await uploadFile(data.thumbnail, "course_thumbnails");
      }

      if (data.modules) {
        for (const module of data.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              
              if (lesson.resources) {
                lesson.resources = lesson.resources.filter((r:any) => r.title && r.file);
                for (const resource of lesson.resources) {
                  const base64Data = resource.file.split(',')[1];
                  const fileBuffer = Buffer.from(base64Data, 'base64');
                  const contentType = resource.file.match(/data:(.*);/)?.[1] || 'application/octet-stream';
                  resource.file = { data: fileBuffer, contentType: contentType };
                }
              }
            }
          }
        }
      }
      const course = await CourseModel.create(data);

      // MODIFICATION: Invalidate the "allCourses" cache after creating a new course
      await redis.del("allCourses");

      res.status(201).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;

      if (data.thumbnail && data.thumbnail.startsWith("data:")) {
        const courseWithThumbnail = await CourseModel.findById(courseId);
        if (courseWithThumbnail?.thumbnail?.public_id) {
          await cloudinary.v2.uploader.destroy(courseWithThumbnail.thumbnail.public_id);
        }
        data.thumbnail = await uploadFile(data.thumbnail, "course_thumbnails");
      }

      if (data.modules) {
        for (const module of data.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              if (lesson.resources) {
                for (const resource of lesson.resources) {
                  if (resource.file && typeof resource.file === 'string' && resource.file.startsWith("data:")) {
                    const base64Data = resource.file.split(',')[1];
                    const fileBuffer = Buffer.from(base64Data, 'base64');
                    const contentType = resource.file.match(/data:(.*);/)?.[1] || 'application/octet-stream';
                    resource.file = { data: fileBuffer, contentType };
                  }
                }
              }
            }
          }
        }
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId, { $set: data }, { new: true, runValidators: true }
      );

      await redis.del(courseId);
      await redis.del("allCourses");

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        return res.status(200).json({ success: true, course });
      }
      const course = await CourseModel.findById(courseId).select(
        "-modules.lessons.videoUrl -modules.lessons.resources"
      );
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);
        return res.status(200).json({ success: true, courses });
      }
      const courses = await CourseModel.find().select(
        "-modules.lessons.videoUrl -modules.lessons.resources"
      );
      await redis.set("allCourses", JSON.stringify(courses), "EX", 604800);
      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseContent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExists = Array.isArray(userCourseList) && userCourseList.find(
        (course: any) => (course._id ? course._id.toString() : course.toString()) === courseId
      );
      if (!courseExists) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      res.status(200).json({ success: true, content: course.modules });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAdminAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await course.deleteOne();
      await redis.del(id);
      await redis.del("allCourses");
      res.status(200).json({ success: true, message: "Course deleted successfully" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getResource = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refreshToken = req.query.token as string;
            if (!refreshToken) return next(new ErrorHandler("Authentication token not provided", 401));
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN || '') as JwtPayload;
            if (!decoded) return next(new ErrorHandler("Invalid authentication token", 401));
            const session = await redis.get(decoded.id);
            if (!session) return next(new ErrorHandler("Your session has expired.", 401));
            const user = JSON.parse(session);

            const { courseId, moduleId, lessonId, resourceId } = req.params;
            const course = await CourseModel.findById(courseId);
            if (!course) return next(new ErrorHandler("Course not found", 404));

            const isEnrolled = user.courses.some((c:any) => c.toString() === courseId);
            if (!isEnrolled) return next(new ErrorHandler("You are not enrolled in this course", 403));
            
            let resource: IResource | undefined | null = null;
            const module = course.modules.find(m => m._id.toString() === moduleId);
            if (module) {
                const lesson = module.lessons.find(l => l._id.toString() === lessonId);
                if (lesson) {
                    resource = lesson.resources.find(r => r._id.toString() === resourceId);
                }
            }

            if (!resource || !resource.file || !resource.file.data) {
                return next(new ErrorHandler("Resource not found or is invalid", 404));
            }
            
            const contentType = resource.file.contentType;
            const extension = mime.extension(contentType); 
            const filename = `${resource.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            res.send(resource.file.data);

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);