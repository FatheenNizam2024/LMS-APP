// C:\LMS App copy Part 2\Lms-App - Copy\server\controllers\submission.controller.ts

import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import CourseModel from "../models/course.model";
import QuizSubmissionModel from "../models/quizSubmission.model";
import AssignmentSubmissionModel from "../models/submission.model"; // Renamed for clarity
import { IQuiz, IQuizQuestion } from "../models/course.model";
import cloudinary from "cloudinary";

// Helper function to upload files to Cloudinary
const uploadFile = async (file: string, folder: string) => {
    const result = await cloudinary.v2.uploader.upload(file, {
      folder,
      resource_type: "auto",
    });
    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
};

// --- NEW: CREATE ASSIGNMENT SUBMISSION (for students) ---
export const createAssignmentSubmission = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, assignmentId, content } = req.body;
      const userId = req.user?._id;

      // Check if user is enrolled in the course
      const userCourseList = req.user?.courses;
      const isEnrolled = Array.isArray(userCourseList) && userCourseList.some(
          (course: any) => (course._id ? course._id.toString() : course.toString()) === courseId
      );
      
      if (!isEnrolled) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }
      
      // Check if a submission already exists for this assignment by this user
      const existingSubmission = await AssignmentSubmissionModel.findOne({ userId, assignmentId });
      if (existingSubmission) {
        return next(new ErrorHandler("You have already submitted for this assignment", 400));
      }

      const submissionData: any = {
        courseId,
        assignmentId,
        userId,
        content: {},
        status: "submitted",
      };

      // Handle content: either a link or a file upload
      if (content.format === "link" && content.url) {
        submissionData.content.format = "link";
        submissionData.content.url = content.url;
      } else if (content.format === "file" && content.file) {
        const uploadedFile = await uploadFile(content.file, "assignment_submissions");
        submissionData.content.format = "file";
        submissionData.content.file = uploadedFile;
      } else {
        return next(new ErrorHandler("Invalid submission content", 400));
      }
      
      const submission = await AssignmentSubmissionModel.create(submissionData);

      res.status(201).json({
        success: true,
        submission,
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// --- SUBMIT QUIZ ---
export const submitQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, quizId, answers } = req.body;
      const userId = req.user?._id;

      // Find the course to validate the quiz exists
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Find the specific quiz within the course's nested structure
      let targetQuiz: (IQuiz & { questions: IQuizQuestion[] }) | null = null;
      let found = false;

      // Check final quizzes
      if (course.finalQuizzes) {
          const finalQuiz = course.finalQuizzes.find(q => q.quizId.toString() === quizId);
          if (finalQuiz) {
              targetQuiz = finalQuiz;
              found = true;
          }
      }
      
      // Check module and lesson quizzes if not found yet
      if (!found) {
        for (const module of course.modules) {
          if (module.quizzes) {
            const moduleQuiz = module.quizzes.find(q => q.quizId.toString() === quizId);
            if (moduleQuiz) {
              targetQuiz = moduleQuiz;
              found = true;
              break;
            }
          }
          for (const lesson of module.lessons) {
            if (lesson.quizzes) {
              const lessonQuiz = lesson.quizzes.find(q => q.quizId.toString() === quizId);
              if (lessonQuiz) {
                targetQuiz = lessonQuiz;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }

      if (!targetQuiz) {
        return next(new ErrorHandler("Quiz not found in this course", 404));
      }

      // Check for existing submission by the user for this quiz
      const existingSubmission = await QuizSubmissionModel.findOne({ userId, quizId });
      if (existingSubmission) {
          return next(new ErrorHandler("You have already submitted this quiz.", 400));
      }

      let score = 0;
      const totalQuestions = targetQuiz.questions.length;

      // Calculate the score
      targetQuiz.questions.forEach((question) => {
        const userAnswer = answers.find((ans: { questionId: string }) => ans.questionId === question._id.toString());
        if (userAnswer && userAnswer.selectedOption === question.correctAnswer) {
          score++;
        }
      });
      
      // Save the submission
      await QuizSubmissionModel.create({
        userId,
        courseId,
        quizId,
        answers,
        score,
        totalQuestions,
      });

      res.status(200).json({
        success: true,
        message: "Quiz submitted successfully.",
        score,
        totalQuestions
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// --- GET A USER'S QUIZ SUBMISSION (Student) ---
export const getUserQuizSubmission = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { quizId } = req.params;
            const userId = req.user?._id;

            const submission = await QuizSubmissionModel.findOne({ userId, quizId });
            
            // It's okay if it's not found.
            if (!submission) {
                return res.status(200).json({
                    success: true,
                    submission: null,
                });
            }

            res.status(200).json({
                success: true,
                submission,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);
export const getAssignmentSubmissions = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.courseId;

            // Find all submissions for the given course and populate the user details
            const submissions = await AssignmentSubmissionModel.find({ courseId })
                .populate('userId', 'name email username')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                submissions,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


// --- NEW: GET ALL QUIZ SUBMISSIONS FOR A COURSE (Admin) ---
export const getQuizSubmissions = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const courseId = req.params.courseId;

            // Find all submissions for the given course and populate user details
            const submissions = await QuizSubmissionModel.find({ courseId })
                .populate('userId', 'name email username')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                submissions,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

export const deleteAssignmentSubmission = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { submissionId } = req.params;

            const submission = await AssignmentSubmissionModel.findById(submissionId);

            if (!submission) {
                return next(new ErrorHandler("Submission not found", 404));
            }

            // Optional: If the submission was a file, you might want to delete it from Cloudinary here
            // if (submission.content.format === 'file' && submission.content.file?.public_id) {
            //     await cloudinary.v2.uploader.destroy(submission.content.file.public_id);
            // }

            await submission.deleteOne();

            res.status(200).json({
                success: true,
                message: "Submission deleted successfully.",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// --- DELETE QUIZ SUBMISSION (Admin) ---
export const deleteQuizSubmission = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { submissionId } = req.params;

            const submission = await QuizSubmissionModel.findById(submissionId);
            if (!submission) {
                return next(new ErrorHandler("Submission not found", 404));
            }

            await submission.deleteOne();

            res.status(200).json({
                success: true,
                message: "Quiz submission deleted successfully.",
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// --- EDIT QUIZ SUBMISSION SCORE (Admin) ---
export const updateQuizSubmissionScore = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { submissionId } = req.params;
            const { score } = req.body;

            if (typeof score !== 'number') {
                return next(new ErrorHandler("Score must be a number", 400));
            }

            const submission = await QuizSubmissionModel.findById(submissionId);
            if (!submission) {
                return next(new ErrorHandler("Submission not found", 404));
            }

            submission.score = score;
            await submission.save();

            res.status(200).json({
                success: true,
                submission,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

export const gradeAssignmentSubmission = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { submissionId } = req.params;
            const { grade, feedback, status } = req.body;

            const submission = await AssignmentSubmissionModel.findById(submissionId);
            if (!submission) {
                return next(new ErrorHandler("Submission not found", 404));
            }

             if (grade) submission.grade = grade;
            if (feedback) submission.feedback = feedback;
            if (status) submission.status = status;

            await submission.save();
            
            // TODO: Optional - Send a notification to the user that their assignment has been graded.

            res.status(200).json({
                success: true,
                submission,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// --- GET A USER'S SUBMISSION FOR A SPECIFIC ASSIGNMENT (Student) ---
export const getUserSubmission = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { assignmentId } = req.params;
            const userId = req.user?._id;

            const submission = await AssignmentSubmissionModel.findOne({ userId, assignmentId });

            // It's okay if no submission is found, it just means they haven't submitted yet.
            if (!submission) {
                return res.status(200).json({
                    success: true,
                    submission: null,
                });
            }

            res.status(200).json({
                success: true,
                submission,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);