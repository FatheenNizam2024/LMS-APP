// C:\Lms-App - Copy\server\services\submission.service.ts

import { Response } from "express";
import SubmissionModel from "../models/submission.model";

// Get all submissions for a specific course (for admin)
export const getSubmissionsForCourse = async (courseId: string, res: Response) => {
  const submissions = await SubmissionModel.find({ courseId })
    .populate("userId", "name email") // Populate user info
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    submissions,
  });
};