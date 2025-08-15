// C:\Lms-App - Copy\server\models\course.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IQuizOption extends Document {
  optionText: string;
}

const quizOptionSchema = new Schema<IQuizOption>({
  optionText: { type: String, required: true },
});

export interface IQuizQuestion extends Document {
  questionText: string;
  options: IQuizOption[];
  correctAnswer: string;
}

const quizQuestionSchema = new Schema<IQuizQuestion>({
  questionText: { type: String, required: true },
  options: [quizOptionSchema],
  correctAnswer: { type: String, required: true },
});

export interface IQuiz extends Document {
  quizId: mongoose.Types.ObjectId; // Unique ID for each quiz category
  title: string;
  questions: IQuizQuestion[];
}

const quizSchema = new Schema<IQuiz>({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  title: { type: String, required: true },
  questions: [quizQuestionSchema],
});



// Schema for uploaded resources like PDFs, DOCX files
export interface IResource extends Document {
  title: string;
  file: {
    data: Buffer; // Store the file as binary data
    contentType: string; // e.g., 'application/pdf'
  };
}

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  file: {
    data: Buffer,
    contentType: String,
  },
});

// Schema for an Assignment
export interface IAssignment extends Document {
  title: string;
  description: string;
  assignmentId: mongoose.Schema.Types.ObjectId;
}

const assignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
});

// Schema for a single Lesson (Unchanged)
export interface ILesson extends Document {
  title: string;
  videoUrl: string;
  //videoLength: number;
  resources: IResource[];
  quizzes?: IQuiz[];
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  //videoLength: { type: Number, required: true },

  resources: [resourceSchema],
  quizzes: [quizSchema],
});

// --- SECTION SCHEMA HAS BEEN REMOVED ---

// --- MODIFIED: Schema for a Module ---
export interface IModule extends Document {
  moduleId: mongoose.Types.ObjectId;
  title: string;
  lessons: ILesson[]; // Now contains Lessons directly
  assignments: IAssignment[];
  quizzes?: IQuiz[];
}

const moduleSchema = new Schema<IModule>({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  title: { type: String, required: true },
  lessons: [lessonSchema], // Now references lessonSchema directly
   assignments: [assignmentSchema],
   quizzes: [quizSchema],
});

// --- Main Course Schema ---
export interface ICourse extends Document {
  name: string;
  description: string;
  price?: number; // MODIFICATION: Added price
  estimatedPrice?: number; // MODIFICATION: Added estimatedPrice
  thumbnail: {
    public_id: string;
    url: string;
  };
  modules: IModule[];
  finalAssignments: IAssignment[];
  finalQuizzes?: IQuiz[];
  purchased?: number;
}

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 }, // MODIFICATION: Added price to schema
    estimatedPrice: { type: Number }, // MODIFICATION: Added estimatedPrice to schema
    thumbnail: {
      public_id: { type: String },
      url: { type: String },
    },
    modules: [moduleSchema],
    finalAssignments: [assignmentSchema], 
    finalQuizzes: [quizSchema],
    purchased: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

courseSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  const courseId = this._id;
  
  // Find all users that have this courseId in their 'courses' array
  // and pull/remove it from the array.
  try {
    await mongoose.model('User').updateMany(
      { "courses": courseId },
      { $pull: { courses: courseId } }
    );
    next();
  } catch (error: any) {
    next(error);
  }
});
// --- END OF NEW HOOK ---



const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;