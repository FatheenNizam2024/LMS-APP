import express from "express";
import {
  // addAnwser,
  // addQuestion,
  // addReplyToReview,
  // addReview,
  deleteCourse,
  editCourse,
  //generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCourseContent,
 // getCourseByUser,
  getSingleCourse,
  uploadCourse,
  getResource,
  uploadCourseVideo, 
  getPresignedVideoUrl,
  deleteCourseVideo,
  deleteResourceFile  

} from "../controllers/course.controller";
import multer from "multer";
import path from "path";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
const courseRouter = express.Router();
// Configure multer for temporary file storage
const upload = multer({ dest: path.join(__dirname, '../temp') });

// ADD THIS ROUTE for uploading a video to a specific lesson
courseRouter.post(
  "/upload-course-video/:courseId/:lessonId",
  isAutheticated,
  authorizeRoles("admin"),
  upload.single("video"), // "video" is the field name from the form
  uploadCourseVideo
);

// ADD THIS ROUTE for students to get the secure streaming URL
courseRouter.get(
  "/get-presigned-video-url/:courseId/:lessonId",
  isAutheticated,
  getPresignedVideoUrl
);

courseRouter.post(
  "/create-course",
  isAutheticated,
  authorizeRoles("admin"),
  uploadCourse
);

courseRouter.put(
  "/edit-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get(
  "/get-admin-courses",
  isAutheticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);

courseRouter.get(
  "/get-course-content/:id",
  isAutheticated, // Only authenticated users can access this
  getCourseContent
);

courseRouter.get(
    "/resource/:courseId/:moduleId/:lessonId/:resourceId",
    getResource // We will create this controller function next
);

// courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

// courseRouter.put("/add-question", isAutheticated, addQuestion);

// courseRouter.put("/add-answer", isAutheticated, addAnwser);

// courseRouter.put("/add-review/:id", isAutheticated, addReview);

// courseRouter.put(
//   "/add-reply",
//   isAutheticated,
//   authorizeRoles("admin"),
//   addReplyToReview
// );

// courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete(
  "/delete-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCourse
);

courseRouter.delete(
  "/delete-course-video/:courseId/:lessonId",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCourseVideo
);

courseRouter.delete(
  "/delete-resource/:courseId/:moduleId/:lessonId/:resourceId",
  isAutheticated,
  authorizeRoles("admin"),
  deleteResourceFile
);

export default courseRouter;
