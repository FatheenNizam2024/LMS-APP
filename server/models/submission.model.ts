// C:\Lms-App - Copy\server\models\submission.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { ICourse } from "./course.model";
import { IUser } from "./admin.model";

// Interface for the content submitted by the user
export interface ISubmittedContent {
  format: "link" | "file"; // Can be a URL or an uploaded file
  url?: string; // For GitHub links, etc.
  file?: {         // For uploaded files (PDF, DOCX)
    public_id: string;
    url: string;
  };
}

export interface ISubmission extends Document {
  courseId: mongoose.Types.ObjectId | ICourse;
  assignmentId: mongoose.Types.ObjectId; 
  userId: mongoose.Types.ObjectId | IUser;
  content: ISubmittedContent;
  status: "pending" | "submitted" | "graded" | "needs revision"; // MODIFICATION: Added status
  grade?: string; // MODIFICATION: Added grade (string to allow "A+", "85/100", etc.)
  feedback?: string; // MODIFICATION: Added feedback
}

const submissionSchema = new Schema<ISubmission>(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    content: {
      format: { type: String, enum: ["link", "file"], required: true },
      url: String,
      file: { public_id: String, url: String },
    },
    // MODIFICATION: Added new fields to the schema
    status: { type: String, enum: ["pending", "submitted", "graded", "needs revision"], default: "pending" },
    grade: String,
    feedback: String,
  },
  { timestamps: true }
);

const SubmissionModel: Model<ISubmission> = mongoose.model("Submission", submissionSchema);

export default SubmissionModel;

