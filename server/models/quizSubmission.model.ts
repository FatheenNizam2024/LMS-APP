import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./admin.model";
import { ICourse } from "./course.model";

// Interface for a single answer provided by the user
export interface IAnswer extends Document {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string;
}

// Main Interface for a Quiz Submission document
export interface IQuizSubmission extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  courseId: mongoose.Types.ObjectId | ICourse;
  quizId: mongoose.Types.ObjectId; // Links to the specific quiz within the course
  answers: IAnswer[];
  score: number; // The number of correct answers
  totalQuestions: number; // The total number of questions in the quiz
}

const answerSchema = new Schema<IAnswer>({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOption: { type: String, required: true },
}, { _id: false });


const quizSubmissionSchema = new Schema<IQuizSubmission>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
  },
  { timestamps: true }
);

const QuizSubmissionModel: Model<IQuizSubmission> = mongoose.model("QuizSubmission", quizSubmissionSchema);

export default QuizSubmissionModel;