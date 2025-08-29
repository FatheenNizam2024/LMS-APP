// C:\Lms-App - Copy\client\types\courses.d.ts
declare module 'react-native-animated-loader';
// A type for the User object, simplified for client-side use

// Type for a single answer in a submission
type IAnswer = {
  questionId: string;
  selectedOption: string;
};

// MODIFICATION: Added the 'answers' property to ISubmission
type ISubmission = {
    _id: string;
    courseId: string;
    assignmentId: string;
    userId: string;
    content: {
      format: "link" | "file";
      url?: string;
      file?: { public_id: string; url: string; };
    };
    status: "pending" | "submitted" | "graded" | "needs revision";
    grade?: string;
    feedback?: string;
    answers: IAnswer[]; // Added this line
    createdAt: string;
    updatedAt: string;
};

// type User = {
//   _id: string;
//   name: string;
//   email: string;
//   avatar?: {
//     url: string;
//   };
//   courses: { _id: string }[];
// };

type IQuizOption = {
  _id: string;
  optionText: string;
};

type IQuizQuestion = {
  _id: string;
  questionText: string;
  options: IQuizOption[];
  correctAnswer: string;
};

type IQuiz = {
  _id: string;
  quizId: string;
  title: string;
  questions: IQuizQuestion[];
};

// type ISubmission = {
//     _id: string;
//     courseId: string;
//     assignmentId: string;
//     userId: string;
//     content: {
//       format: "link" | "file";
//       url?: string;
//       file?: { public_id: string; url: string; };
//     };
//     status: "pending" | "submitted" | "graded" | "needs revision";
//     grade?: string;
//     feedback?: string;
//     createdAt: string;
//     updatedAt: string;
// };

// Type for uploaded resources like PDFs, DOCX files
type ResourceType = {
  title: string;
  file: {
    public_id: string;
    url: string;
  } | { data: any, contentType: string };
};

// Type for an Assignment
type AssignmentType = {
  title: string;
  description: string;
  assignmentId: string; // Using string for simplicity on the client
};

// Type for a single Lesson
type LessonType = {
  _id: string;
  title: string;
  video?: {
    objectName: string;
    bucket: string;
  };
  resources: ResourceType[];
  assignment?: AssignmentType;
  quizzes?: IQuiz[];
};

// Type for a Module (a group of sections)
type ModuleType = {
  _id: string;
  moduleId: string; // Add moduleId
  title: string;
  lessons: LessonType[]; // Changed from 'sections' to 'lessons'
  assignments?: AssignmentType[];
  quizzes?: IQuiz[];
};

// --- NEW Main CoursesType ---
type CoursesType = {
  _id: string;
  name: string;
  description: string;
  price: number; // MODIFICATION: Added price
  estimatedPrice?: number; // MODIFICATION: Added estimatedPrice
  level: string; // MODIFICATION: Added level
  thumbnail: {
    public_id: string | any;
    url: string | any;
  };
  // The new hierarchical structure
  modules: ModuleType[];
  finalAssignments?: AssignmentType[];
  finalQuizzes?: IQuiz[];
  purchased?: number;
  reviews: ReviewType[];
  ratings?: number;
};


// --- Old types that might still be used in other files ---
type CommentType = {
  _id: string;
  user: User;
  question: string;
  questionReplies: CommentType[];
};

type ReviewType = {
  user: User;
  rating?: number;
  comment: string;
  commentReplies?: ReviewType[];
};

// This type is no longer the main content holder, but kept for reference if needed
type CourseDataType = {
  _id: string | any;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  links: any[]; // Simplified link type
  suggestion: string;
  questions: CommentType[];
};