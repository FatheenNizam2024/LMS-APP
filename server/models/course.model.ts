// C:\Lms-App - Copy\server\models\course.model.ts

import mongoose, { Document, Model, Schema } from "mongoose";
import { minioClient } from "../utils/minioClient";

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
    objectName: string;   // e.g., courseId/lessonId/resourceId/filename.pdf
    bucket: string;
    originalName: string; // e.g., "Lecture Notes Week 1.pdf"
    contentType: string;  // e.g., 'application/pdf'
  };
}

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  file: {
    objectName: String,
    bucket: String,
    originalName: String,
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
  video: {
    objectName: string; // This will be the path to the .m3u8 file in MinIO
    bucket: string;
  };
  resources: IResource[];
  quizzes?: IQuiz[];
}

const lessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  video: {
    objectName: { type: String }, // Not required, as a lesson might be an assignment
    bucket: { type: String },
  },

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
  categoryId: mongoose.Schema.Types.ObjectId;
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
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
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
  const course = this; // 'this' refers to the course document being deleted
  const courseId = course._id;
  
  try {
    // Step 1: Remove course from Admin and Student arrays (already implemented)
    await mongoose.model('Admin').updateMany(
      { "courses": courseId },
      { $pull: { courses: courseId } }
    );
    await mongoose.model('Student').updateMany(
      { "courses": courseId },
      { $pull: { courses: courseId } }
    );

    // Step 2: Delete associated video files from MinIO
    const bucketName = 'lms-videos'; // Your bucket name
    
    // List all objects in the course's "folder"
    const objectsListStream = minioClient.listObjects(bucketName, courseId.toString(), true);
    
    // Create a list of object names to be deleted
    const objectsToDelete: string[] = [];
    for await (const obj of objectsListStream) {
        if (obj.name) {
            objectsToDelete.push(obj.name);
        }
    }
    
    // If there are files to delete, run the removeObjects command
    if (objectsToDelete.length > 0) {
        console.log(`[DELETER] Found ${objectsToDelete.length} video files to delete from MinIO for course ${courseId}...`);
        await minioClient.removeObjects(bucketName, objectsToDelete);
        console.log(`[DELETER] Successfully deleted video files from MinIO.`);
    }

    next();
  } catch (error: any) {
    console.error(`[DELETER] Error during cleanup for course ${courseId}:`, error);
    next(error);
  }
});

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;