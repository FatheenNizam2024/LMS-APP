import express from "express";
import {
  registrationUser,
  activateUser,
  adminLogin,
  studentLogin,
  studentVerifyOtp,
  logoutUser,
  adminGetAllStudents,
  adminCreateStudent,
  adminUpdateStudent,
  adminDeleteStudent,
  getAllAdmins,
  getStudentInfo,
  getAdminInfo,
  updateUserEnrollment,
  getAvatarPresignedUrl,
  updateAccessToken,
  updateStudentAvatarMinIO,
  adminDeleteStudentAvatar
} from "../controllers/user.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
const userRouter = express.Router();

// --- ADMIN AUTH & INFO ---
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/admin-login", adminLogin);
userRouter.get("/get-admins", isAutheticated, authorizeRoles("admin"), getAllAdmins);

// --- STUDENT AUTH ---
userRouter.post("/student-login", studentLogin);
userRouter.post("/student-verify-otp", studentVerifyOtp);
userRouter.get("/me-student", isAutheticated, getStudentInfo);
userRouter.put("/update-student-avatar-minio", isAutheticated, updateStudentAvatarMinIO);
// --- UNIVERSAL ---
userRouter.get("/logout", isAutheticated, logoutUser);
userRouter.get("/me", isAutheticated, authorizeRoles("admin"), getAdminInfo);
userRouter.get("/refresh", updateAccessToken);
userRouter.get("/get-avatar-url", isAutheticated, getAvatarPresignedUrl);
// --- ADMIN ACTIONS ON STUDENTS ---
userRouter.get("/admin/get-students", isAutheticated, authorizeRoles("admin"), adminGetAllStudents);
userRouter.post("/admin/create-student", isAutheticated, authorizeRoles("admin"), adminCreateStudent);
userRouter.put("/admin/update-student/:id", isAutheticated, authorizeRoles("admin"), adminUpdateStudent);
userRouter.delete("/admin/delete-student/:id", isAutheticated, authorizeRoles("admin"), adminDeleteStudent);
userRouter.put("/admin/update-student-enrollment", isAutheticated, authorizeRoles("admin"), updateUserEnrollment);
userRouter.delete("/admin/delete-student-avatar/:studentId", isAutheticated, authorizeRoles("admin"), adminDeleteStudentAvatar);

userRouter.get(
  "/admin/get-avatar-url", 
  isAutheticated, 
  authorizeRoles("admin"), 
  getAvatarPresignedUrl
);


export default userRouter;