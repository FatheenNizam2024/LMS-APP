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
import mongoose from "mongoose";
import userModel from "../models/admin.model";
import { IncomingMessage } from "http";
// Add these imports at the top of the file
import { minioClient } from "../utils/minioClient";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import { slugify } from "../utils/slugify";

// Promisify the exec function for use with async/await
const execPromise = util.promisify(exec);


// ADD THIS NEW FUNCTION somewhere in the file
export const uploadCourseVideo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    let tempVideoPath: string | undefined = undefined;
    let hlsDir: string | undefined = undefined;
    try {
      const { courseId, lessonId } = req.params;
      const videoFile = req.file;
      if (!videoFile) {
        return next(new ErrorHandler("No video file uploaded.", 400));
      }
      tempVideoPath = videoFile.path;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      let lesson: any = null;
      for (const module of course.modules) {
        const foundLesson = module.lessons.find(l => l._id.toString() === lessonId);
        if (foundLesson) {
          lesson = foundLesson;
          break;
        }
      }
      if (!lesson) {
        return next(new ErrorHandler("Lesson not found", 404));
      }

      // THE FIX: Create slugs from the course and lesson titles for naming
      const courseSlug = slugify(course.name);
      const lessonSlug = slugify(lesson.title);

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      hlsDir = path.join(tempDir, lessonId);
      if (fs.existsSync(hlsDir)) {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      }
      fs.mkdirSync(hlsDir);
      const inputPath = `"${videoFile.path}"`;
      const ffmpegCommand = `
        ffmpeg -i ${inputPath} \
        -preset slow -g 48 -sc_threshold 0 \
        -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 -map 0:v:0 -map 0:a:0 \
        -s:v:0 640x360 -c:v:0 libx264 -b:v:0 800k \
        -s:v:1 960x540 -c:v:1 libx264 -b:v:1 1400k \
        -s:v:2 1280x720 -c:v:2 libx264 -b:v:2 2800k \
        -c:a aac -b:a 128k \
        -var_stream_map "v:0,a:0,name:360p v:1,a:1,name:540p v:2,a:2,name:720p" \
        -master_pl_name master.m3u8 \
        -f hls -hls_time 10 -hls_playlist_type vod -hls_list_size 0 \
        -hls_segment_filename "${hlsDir}/%v/segment%03d.ts" \
        "${hlsDir}/%v/playlist.m3u8"
      `.replace(/\s+/g, ' ').trim();
      await execPromise(ffmpegCommand);
      
      const bucketName = 'lms-videos';
      const qualityDirs = fs.readdirSync(hlsDir);
      for (const dir of qualityDirs) {
          if (dir.endsWith('p')) {
              const dirPath = path.join(hlsDir, dir);
              const files = fs.readdirSync(dirPath);
              for (const file of files) {
                  const filePath = path.join(dirPath, file);
                  // THE FIX: Use slugs for the object name
                  const objectName = `${courseSlug}/${lessonSlug}/${dir}/${file}`;
                  await minioClient.fPutObject(bucketName, objectName, filePath, {});
              }
          }
      }
      const masterPlaylistPath = path.join(hlsDir, 'master.m3u8');
      // THE FIX: Use slugs for the master playlist object name
      const masterObjectName = `${courseSlug}/${lessonSlug}/master.m3u8`;
      await minioClient.fPutObject(bucketName, masterObjectName, masterPlaylistPath, {});
      
      lesson.video = {
        objectName: masterObjectName,
        bucket: bucketName,
      };
      await course.save();
      res.status(200).json({
        success: true,
        message: "Video processed and uploaded successfully.",
        course,
      });
    } catch (error: any) {
       console.error('[UPLOADER] An error occurred in the upload process:', error);
      return next(new ErrorHandler(error.message, 500));
    } finally {
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (hlsDir && fs.existsSync(hlsDir)) {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      }
    }
  }
);

// ADD THIS NEW FUNCTION as well
export const getPresignedVideoUrl = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { courseId, lessonId } = req.params;
            const user = req.user;

            const isEnrolled = user?.courses.some((c: any) => c.toString() === courseId);
            if (!isEnrolled) {
                return next(new ErrorHandler("You are not enrolled in this course", 403));
            }

            const course = await CourseModel.findById(courseId);
            let lesson: any = null;
            for (const module of course!.modules) {
                const foundLesson = module.lessons.find(l => l._id.toString() === lessonId);
                if (foundLesson) {
                    lesson = foundLesson;
                    break;
                }
            }

            if (!lesson || !lesson.video || !lesson.video.objectName) {
                return next(new ErrorHandler("Video for this lesson not found", 404));
            }

            const presignedUrl = await minioClient.presignedGetObject(
                lesson.video.bucket,
                lesson.video.objectName,
                7 * 60 * 60
            );
            res.status(200).json({
                success: true,
                url: presignedUrl
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

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
      const courseId = data._id || new mongoose.Types.ObjectId().toString();
      data._id = courseId;
      // THE FIX: Create slug from course name
      const courseSlug = slugify(data.name); 
      if (data.thumbnail && data.thumbnail.startsWith("data:")) {
        data.thumbnail = await uploadFile(data.thumbnail, "course_thumbnails");
      }
      if (data.modules) {
        for (const module of data.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              const lessonSlug = slugify(lesson.title);
              if (lesson.resources) {
                lesson.resources = lesson.resources.filter((r:any) => r.title && r.file);
                for (const resource of lesson.resources) {
                  if (resource.file && typeof resource.file === 'string' && resource.file.startsWith("data:")) {
                    const base64Data = resource.file.split(';base64,').pop();
                    if (!base64Data) continue;
                    const fileBuffer = Buffer.from(base64Data, 'base64');
                    const fileData = resource.file.substring(0, resource.file.indexOf(';base64,'));
                    const contentTypeMatch = fileData.match(/data:(.*)/);
                    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
                    const resourceSlug = slugify(resource.title);
                    const originalName = resource.title.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFilePath = path.join(tempDir, originalName);
                    fs.writeFileSync(tempFilePath, fileBuffer as any);
                    
                    // THE FIX: Change the bucket name for resources
                    const bucketName = 'lms-resources';
                    // THE FIX: Use a descriptive, slug-based object name
                    const objectName = `${courseSlug}/${lessonSlug}/resource_${resourceSlug}/${originalName}`;
                    
                    await minioClient.fPutObject(bucketName, objectName, tempFilePath, { 'Content-Type': contentType });
                    fs.unlinkSync(tempFilePath);
                    resource.file = {
                      objectName,
                      bucket: bucketName,
                      originalName,
                      contentType,
                    };
                  }
                }
              }
            }
          }
        }
      }    
      const course = await CourseModel.create(data);
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
      // THE FIX: Create slug from course name
      const courseSlug = slugify(data.name); 

      if (data.thumbnail && data.thumbnail.startsWith("data:")) {
        // ... (thumbnail logic is unchanged)
      }
      if (data.modules) {
        for (const module of data.modules) {
          if (module.lessons) {
            for (const lesson of module.lessons) {
              const lessonSlug = slugify(lesson.title);
              if (lesson.resources) {
                for (const resource of lesson.resources) {
                  if (resource.file && typeof resource.file === 'string' && resource.file.startsWith("data:")) {
                    const base64Data = resource.file.split(';base64,').pop();
                    if (!base64Data) continue;
                    const fileBuffer = Buffer.from(base64Data, 'base64');
                    const fileData = resource.file.substring(0, resource.file.indexOf(';base64,'));
                    const contentTypeMatch = fileData.match(/data:(.*)/);
                    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
                    const resourceSlug = slugify(resource.title);
                    const originalName = resource.title.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFilePath = path.join(tempDir, originalName);
                    fs.writeFileSync(tempFilePath, fileBuffer as any);
                    
                    // THE FIX: Change the bucket name for resources
                    const bucketName = 'lms-resources';
                    // THE FIX: Use a descriptive, slug-based object name
                    const objectName = `${courseSlug}/${lessonSlug}/resource_${resourceSlug}/${originalName}`;
                    
                    await minioClient.fPutObject(bucketName, objectName, tempFilePath, { 'Content-Type': contentType });
                    fs.unlinkSync(tempFilePath);
                    resource.file = {
                      objectName,
                      bucket: bucketName,
                      originalName,
                      contentType,
                    };
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

            if (!resource || !resource.file || !resource.file.objectName) {
                return next(new ErrorHandler("Resource not found or is invalid", 404));
            }
            
            const bucketName = resource.file.bucket;
            const objectName = resource.file.objectName;
            const fileName = resource.file.originalName;

            // Generate a presigned URL that forces the browser to download
            const presignedUrl = await minioClient.presignedGetObject(
                bucketName,
                objectName,
                60 * 60, // URL valid for 1 hour
                { 'response-content-disposition': `attachment; filename="${fileName}"` }
            );
            
            // Redirect the user to this URL
            res.redirect(presignedUrl);

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

export const deleteCourseVideo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, lessonId } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      let lesson: any = null;
      for (const module of course.modules) {
        const foundLesson = module.lessons.find(l => l._id.toString() === lessonId);
        if (foundLesson) {
          lesson = foundLesson;
          break;
        }
      }

      if (!lesson || !lesson.video || !lesson.video.objectName) {
        return next(new ErrorHandler("Video for this lesson not found", 404));
      }

      const bucketName = lesson.video.bucket;
      const objectPrefix = `${courseId}/${lessonId}/`; // The "folder" for this lesson's video files

      // List all objects in the lesson's folder
      const objectsListStream = minioClient.listObjects(bucketName, objectPrefix, true);
      const objectsToDelete: string[] = [];
      for await (const obj of objectsListStream) {
        if (obj.name) objectsToDelete.push(obj.name);
      }
      
      if (objectsToDelete.length > 0) {
        await minioClient.removeObjects(bucketName, objectsToDelete);
        console.log(`[DELETER] Deleted ${objectsToDelete.length} files from MinIO for lesson ${lessonId}.`);
      }
      
      // Clear the video reference from the lesson in MongoDB
      lesson.video = undefined;
      await course.save();

      res.status(200).json({
        success: true,
        message: "Video deleted successfully.",
        course,
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// NEW FUNCTION to delete resource files
export const deleteResourceFile = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, moduleId, lessonId, resourceId } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) return next(new ErrorHandler("Course not found", 404));

      const module = course.modules.find(m => m._id.toString() === moduleId);
      if (!module) return next(new ErrorHandler("Module not found", 404));

      const lesson = module.lessons.find(l => l._id.toString() === lessonId);
      if (!lesson) return next(new ErrorHandler("Lesson not found", 404));

      const resourceIndex = lesson.resources.findIndex(r => r._id.toString() === resourceId);
      if (resourceIndex === -1) return next(new ErrorHandler("Resource not found", 404));
      
      const resource = lesson.resources[resourceIndex];

      if (resource.file && resource.file.objectName) {
        await minioClient.removeObject(resource.file.bucket, resource.file.objectName);
      }
      
      // Remove the entire resource from the array
      lesson.resources.splice(resourceIndex, 1);
      
      await course.save();

      res.status(200).json({ success: true, message: "Resource deleted successfully.", course });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);