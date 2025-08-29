require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import { rateLimit } from "express-rate-limit";
import submissionRouter from "./routes/submission.route"; // NEW: Import the submission router
import bannerRouter from "./routes/banner.route";
import "./models/admin.model";
import "./models/student.model";
import "./models/course.model";
import "./models/order.Model";
import "./models/notification.Model";
import "./models/submission.model";
import "./models/quizSubmission.model";
import "./models/layout.model";
// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// THE DEFINITIVE FIX FOR CORS & LOGOUTS
// Whitelist all ngrok-free.app subdomains and localhost
const allowedOrigins = [
  'http://localhost:3000', // For local admin dev
  /https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/ // Regex for any ngrok free tier URL
];

// cors => cross origin resource sharing
app.use(cors({
  origin: true, 
  credentials: true, 
}));

// api requests limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});


// routes
// FIX: Using separate app.use for each router
app.use("/api/v1", userRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", bannerRouter); 
app.use("/api/v1", courseRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", analyticsRouter);
app.use("/api/v1", layoutRouter);
app.use("/api/v1", submissionRouter); // NEW: Use the submission route

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    succcess: true,
    message: "API is working",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(limiter);
app.use(ErrorMiddleware);
