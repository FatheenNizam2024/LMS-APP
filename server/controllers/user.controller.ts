require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import AdminModel, { IUser } from "../models/admin.model";
import CourseModel from "../models/course.model";
import mongoose from "mongoose";
import StudentModel from "../models/student.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersService } from "../services/user.service";
import cloudinary from "cloudinary";
import { minioClient } from "../utils/minioClient";


// --- ADMIN SELF-REGISTRATION ---
export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;
      const isAdminExist = await AdminModel.findOne({ email });
      if (isAdminExist) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      const user = { name, email, password };
      const activationToken = createActivationToken(user);
      const { token, activationCode } = activationToken;
      const data = { user: { name: user.name }, activationCode };
      
      await sendMail({
        email: user.email,
        subject: "Activate Your Admin Account",
        template: "activation-mail.ejs",
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email (${user.email}) to activate your account!`,
        activationToken: token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const createActivationToken = (user: any) => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign({ user, activationCode }, process.env.ACTIVATION_SECRET as Secret, { expiresIn: "5m" });
  return { token, activationCode };
};

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as any;

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      const { name, email, password } = newUser.user;
      const existUser = await AdminModel.findOne({ email });
      if (existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      await AdminModel.create({ name, email, password, role: 'admin' });
      res.status(201).json({ success: true });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// --- ADMIN LOGIN (For Admin Panel) ---
export const adminLogin = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler("Please enter email and password", 400));
        }
        const admin = await AdminModel.findOne({ email }).select("+password");
        if (!admin || admin.role !== 'admin') {
            return next(new ErrorHandler("Invalid credentials or not an admin", 400));
        }
        const isPasswordMatch = await admin.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }
        sendToken(admin, 200, res);
    }
);

// --- ADMIN ACTIONS ON STUDENTS ---
export const adminGetAllStudents = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const students = await StudentModel.find().populate("courses", "name").populate("avatar").sort({ batch: 1, name: 1 });
    res.status(200).json({ success: true, students });
});

export const updateStudentAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      const studentId = req.user?._id;

      const student = await StudentModel.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // If an avatar is provided (upload/change)
      if (avatar) {
        // If user already has an avatar, delete the old one
        if (student.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(student.avatar.public_id);
        }
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "student_avatars",
          width: 150,
          height: 150,
        });
        student.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      } else { // If avatar is null/undefined, it means remove
          if (student.avatar?.public_id) {
            await cloudinary.v2.uploader.destroy(student.avatar.public_id);
          }
          student.avatar = undefined; // Remove avatar from the document
      }

      await student.save();
      await redis.set(student._id.toString(), JSON.stringify(student));

      res.status(200).json({
        success: true,
        user: student,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateStudentAvatarMinIO = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body; // Avatar is expected to be a base64 string
      const studentId = req.user?._id;

      const student = await StudentModel.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      const bucketName = 'lms-avatars'; // The new bucket for avatars

      // If user already has an avatar, delete the old one from MinIO
      if (student.avatar?.public_id && student.avatar.url === 'minio') {
          try {
            // Check if the old URL was a cloudinary URL. If so, don't try to delete from MinIO.
            
              await minioClient.removeObject(bucketName, student.avatar.public_id);
              console.log(`[AVATAR] Successfully deleted old avatar: ${student.avatar.public_id}`);
                
           } catch (e) {
            console.log("Old avatar not found in MinIO, proceeding to upload new one.");
          }
      }

      let avatarData: any = {}; // Use 'any' to allow 'undefined'

      if (avatar) {
        // THE FIX: Parse the MIME type and base64 data from the incoming string
        const matches = avatar.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return next(new ErrorHandler("Invalid avatar data format", 400));
        }
        
        const mimeType = matches[1]; // e.g., "image/png"
        const base64Data = matches[2];
        const fileExtension = mimeType.split('/')[1]; // e.g., "png"
        
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const objectName = `student_${studentId}/avatar_${Date.now()}.${fileExtension}`;

        // Use the extracted MIME type when uploading to MinIO
        await minioClient.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, { 'Content-Type': mimeType });
        
        avatarData = {
          public_id: objectName,
          url: `minio`,
        };

      } else {
          avatarData = undefined;
      }
      
      student.avatar = avatarData;
      await student.save();
      
      await redis.set(student._id.toString(), JSON.stringify(student));

      res.status(200).json({
        success: true,
        user: student,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// --- NEW FUNCTION TO GET AVATAR PRESIGNED URL ---
// export const getAvatarPresignedUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const objectName = req.params.objectName; // objectName is the public_id
//         if (!objectName) {
//             return next(new ErrorHandler("Object name is required", 400));
//         }

//         const url = await minioClient.presignedGetObject('lms-avatars', objectName, 24 * 60 * 60); // URL valid for 24 hours
//         res.status(200).json({ success: true, url });
//     } catch (error: any) {
//         return next(new ErrorHandler("Could not retrieve avatar: " + error.message, 404));
//     }
// });

export const getAvatarPresignedUrl = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { objectName } = req.query;
         if (!objectName || typeof objectName !== 'string') {
            return next(new ErrorHandler("Object name is required", 400));
        }
        const url = await minioClient.presignedGetObject('lms-avatars', objectName, 24 * 60 * 60);
        res.json({ success: true, url: url });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 404));
    }
});

export const adminCreateStudent = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, email, username, password, batch } = req.body;
        const isEmailExist = await StudentModel.findOne({ email });
        if (isEmailExist) return next(new ErrorHandler("Email already exists", 400));
        const isUsernameExist = await StudentModel.findOne({ username });
        if (isUsernameExist) return next(new ErrorHandler("Username has been taken", 400));
        
        const student = await StudentModel.create({ name, email, username, password, batch });
        res.status(201).json({ success: true, student });
    }
);

export const adminUpdateStudent = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, email, username, password, batch } = req.body;
        const studentId = req.params.id;
        const student = await StudentModel.findById(studentId);
        if (!student) return next(new ErrorHandler("Student not found", 404));
        const isEmailExist = await StudentModel.findOne({ email, _id: { $ne: studentId } });
        if(isEmailExist) return next(new ErrorHandler("Email already exists", 400));
        const isUsernameExist = await StudentModel.findOne({ username, _id: { $ne: studentId } });
        if(isUsernameExist) return next(new ErrorHandler("Username has been taken", 400));
        student.name = name;
        student.email = email;
        student.username = username;
        student.batch = batch;
        if (password && password !== "") {
            student.password = password;
        }
        await student.save();
        res.status(200).json({ success: true, student });
    }
);

export const adminDeleteStudent = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const student = await StudentModel.findById(id);
    if (!student) return next(new ErrorHandler("Student not found", 404));
    const enrolledCourseIds = student.courses;
    if (enrolledCourseIds && enrolledCourseIds.length > 0) {
        await CourseModel.updateMany(
            { _id: { $in: enrolledCourseIds } },
            { $inc: { purchased: -1 } }
        );
    }
    await student.deleteOne();
    await redis.del(id);
    res.status(200).json({ success: true, message: "Student deleted successfully" });
});

// --- STUDENT LOGIN FLOW (For Client App) ---
export const studentLogin = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return next(new ErrorHandler("Please enter username and password", 400));
        }
        const student = await StudentModel.findOne({ username }).select("+password");
        if (!student) {
            return next(new ErrorHandler("Invalid username or password", 400));
        }
        const isPasswordMatch = await student.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid username or password", 400));
        }
        
        const loginOtp = Math.floor(1000 + Math.random() * 9000).toString();
        await redis.set(`login_otp:${student._id}`, loginOtp, "EX", 300);
        
        const data = { user: { name: student.name }, loginOtp };
        try {
            await sendMail({
              email: student.email,
              subject: "Your Login OTP",
              template: "login-otp-mail.ejs",
              data,
            });
            res.status(200).json({
              success: true,
              message: `An OTP has been sent to ${student.email}`,
              userId: student._id,
            });
        } catch (error: any) {
            await redis.del(`login_otp:${student._id}`);
            return next(new ErrorHandler(error.message, 500));
        }
    }
);



export const studentVerifyOtp = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, otp } = req.body;
            if (!userId || !otp) {
                return next(new ErrorHandler("Request is missing userId or otp", 400));
            }

            const storedOtp = await redis.get(`login_otp:${userId}`);
            
            if (!storedOtp) {
                return next(new ErrorHandler("OTP has expired. Please try logging in again.", 400));
            }

            if (storedOtp !== otp) {
                return next(new ErrorHandler("Invalid OTP.", 400));
            }

            const student = await StudentModel.findById(userId);
            if (!student) {
                return next(new ErrorHandler("Student not found.", 404));
            }

            // Success! Clear the OTP.
            await redis.del(`login_otp:${userId}`);
            
            // Manually create tokens and session for the student
            const accessToken = jwt.sign({ id: student._id, role: 'student' }, process.env.ACCESS_TOKEN || "", { expiresIn: "30m" });
            const refreshToken = jwt.sign({ id: student._id, role: 'student' }, process.env.REFRESH_TOKEN || "", { expiresIn: "30d" });
            
            await redis.set(student._id.toString(), JSON.stringify(student));

            res.status(200).json({
                success: true,
                user: student, // The client app expects the user object here
                accessToken,
                refreshToken,
            });

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);
// --- UNIVERSAL LOGOUT ---
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// --- GET ALL ADMINS ---
export const getAllAdmins = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        getAllUsersService(res);
    }
);

// Add this function to user.controller.ts

// --- GET LOGGED-IN ADMIN INFO ---
export const getAdminInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?._id;
      const admin = await AdminModel.findById(adminId);

      if (!admin) {
          return next(new ErrorHandler("Admin not found", 404));
      }

      res.status(200).json({
        success: true,
        user: admin, // Use the key 'user' to match the frontend's expectation
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getStudentInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?._id;
      const student = await StudentModel.findById(studentId).populate({
        path: "courses",
        //select: "name" // We only need the name and the default _id
      });

      if (!student) {
          return next(new ErrorHandler("Student not found", 404));
      }

      res.status(200).json({
        success: true,
        user: student, // Send back with the key 'user' to match the client's expectation
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use the refresh token from the request headers
      const refresh_token = req.headers["refresh-token"] as string;
      if (!refresh_token) {
        return next(new ErrorHandler("Refresh token not found", 400));
      }

      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
      if (!decoded || !decoded.id) {
        return next(new ErrorHandler("Invalid refresh token", 400));
      }
      
      const session = await redis.get(decoded.id);
      if (!session) {
        return next(new ErrorHandler("Session expired. Please login again.", 400));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN || "", { expiresIn: "120m" });
      const newRefreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN || "", { expiresIn: "30d" });

      req.user = user;
      
      // THIS IS THE CRITICAL FIX: Send back new tokens and update cookies
      // res.cookie("access_token", accessToken, { maxAge: 1000 * 60 * 60 }); // 1 hour
      // res.cookie("refresh_token", newRefreshToken, { maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7 days

      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      });
      
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


export const updateUserEnrollment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, courseId } = req.body;

        const student = await StudentModel.findById(userId);
        const course = await CourseModel.findById(courseId);

        if (!student || !course) {
            return next(new ErrorHandler("Student or Course not found", 404));
        }
        
        const courseIndexInStudent = student.courses.findIndex(
            (c: any) => c._id.toString() === courseId
        );

        if (courseIndexInStudent > -1) {
            // Unenroll
            student.courses.splice(courseIndexInStudent, 1);
            course.purchased = Math.max(0, (course.purchased || 0) - 1);
        } else {
            // Enroll
            // THE FIX: Push only the course ID, not the whole object.
            student.courses.push(course._id as any);
            course.purchased = (course.purchased || 0) + 1;
        }
        
        await student.save();
        await course.save();

        await redis.set(student._id.toString(), JSON.stringify(student));
        await redis.del(courseId);
        await redis.del("allCourses");

        res.status(200).json({ success: true, student });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const adminDeleteStudentAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;

      const student = await StudentModel.findById(studentId);
      if (!student) {
        return next(new ErrorHandler("Student not found", 404));
      }

      // Check if the student has an avatar to delete
      if (student.avatar && student.avatar.public_id) {
        // Delete the object from MinIO
        await minioClient.removeObject('lms-avatars', student.avatar.public_id);
        
        // Remove the avatar reference from the student document
        student.avatar = undefined;
        await student.save();

        // Update the user's session in Redis to reflect the change immediately
        await redis.set(student._id.toString(), JSON.stringify(student));
        
        res.status(200).json({
          success: true,
          message: "Student avatar deleted successfully.",
          student, // Send back the updated student object
        });
      } else {
        return next(new ErrorHandler("Student does not have an avatar to delete.", 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);