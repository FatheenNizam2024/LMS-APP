// C:\LMS App copy Part 2\Lms-App - Copy\server\routes\submission.route.ts

import express from "express";
import { isAutheticated, authorizeRoles } from "../middleware/auth";
import { 
    submitQuiz, 
    getAssignmentSubmissions, // MODIFICATION: Import new controller
    getQuizSubmissions, // MODIFICATION: Import new controller
    createAssignmentSubmission,
    deleteAssignmentSubmission,
    deleteQuizSubmission,      // <-- Import new controller
    updateQuizSubmissionScore,  // <-- Import new controller
    gradeAssignmentSubmission, // <-- Import new controller
    getUserSubmission,
    getUserQuizSubmission          // <-- Import new controller
} from "../controllers/submission.controller";

const submissionRouter = express.Router();

// --- Student Routes ---
submissionRouter.post("/submit-quiz", isAutheticated, submitQuiz);
submissionRouter.post(
  "/submit-assignment", 
  isAutheticated, 
  createAssignmentSubmission
);
// MODIFICATION: Add route for a student to get their own submission status
submissionRouter.get("/user-submission/:assignmentId", isAutheticated, getUserSubmission);
submissionRouter.get("/user-quiz-submission/:quizId", isAutheticated, getUserQuizSubmission);
// --- Admin Routes ---
// MODIFICATION: Add new routes for admins to fetch submissions
submissionRouter.get(
    "/assignment-submissions/:courseId", 
    isAutheticated, 
    authorizeRoles("admin"), 
    getAssignmentSubmissions
);

submissionRouter.put(
    "/grade-assignment/:submissionId",
    isAutheticated,
    authorizeRoles("admin"),
    gradeAssignmentSubmission
);

submissionRouter.get(
    "/quiz-submissions/:courseId", 
    isAutheticated, 
    authorizeRoles("admin"), 
    getQuizSubmissions
);

// MODIFICATION: Add the new DELETE route
submissionRouter.delete(
    "/assignment-submission/:submissionId",
    isAutheticated,
    authorizeRoles("admin"),
    deleteAssignmentSubmission
);

submissionRouter.delete(
    "/quiz-submission/:submissionId",
    isAutheticated,
    authorizeRoles("admin"),
    deleteQuizSubmission
);

submissionRouter.put(
    "/quiz-submission-score/:submissionId",
    isAutheticated,
    authorizeRoles("admin"),
    updateQuizSubmissionScore
);



export default submissionRouter;