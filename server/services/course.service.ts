import { Response } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";

// create course
export const createCourse = CatchAsyncError(async(data:any,res:Response)=>{
    const course = await CourseModel.create(data);
    res.status(201).json({
        success:true,
        course
    });
})

// Get All Courses
export const getAllCoursesService = async (res: Response) => {
    // THE DEFINITIVE FIX: Fetch all courses and explicitly populate all nested levels.
    // This guarantees the admin panel gets the complete data it needs.
    const courses = await CourseModel.find().populate({
        path: 'modules',
        populate: {
            path: 'lessons',
            populate: [
                { path: 'resources' },
                { path: 'quizzes' }
            ]
        }
    });
  
    res.status(200).json({
      success: true,
      courses,
    });
  };
  