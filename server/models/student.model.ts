import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IStudent extends Document {
  name: string;
  email: string;
  username: string;
  batch: string;
  password: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  courses: mongoose.Types.ObjectId[];
  comparePassword: (password: string) => Promise<boolean>;
}

const studentSchema: Schema<IStudent> = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String, required: true,
        validate: {
            validator: (value: string) => emailRegexPattern.test(value),
            message: "Please enter a valid email",
        },
        unique: true,
    },
    username: { type: String, required: true, unique: true },
    batch: { type: String, required: true },
    password: {
        type: String, required: true,
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String,
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
}, { timestamps: true });

studentSchema.pre<IStudent>("save", async function (next) {
  if (!this.isModified("password")) { return next(); }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const StudentModel: Model<IStudent> = mongoose.model("Student", studentSchema);

export default StudentModel;