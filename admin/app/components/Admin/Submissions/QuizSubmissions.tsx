"use client";
import React, { FC, useMemo, useState, useEffect } from "react";
import { useGetQuizSubmissionsQuery, useDeleteQuizSubmissionMutation, useUpdateQuizSubmissionScoreMutation } from "@/redux/features/submissions/submissionsApi";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { Box, Modal, Button, Typography, IconButton, TextField } from "@mui/material";
import { toast } from "react-hot-toast";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

type Props = {
  courseId: string;
};

const findQuizContext = (course: any, quizId: string) => {
    if (!course || !quizId) return null;
    const allQuizzes = [
        ...(course.finalQuizzes || []),
        ...course.modules.flatMap((m: any) => m.quizzes || []),
        ...course.modules.flatMap((m: any) => m.lessons.flatMap((l: any) => l.quizzes || [])),
    ];
    const foundQuiz = allQuizzes.find((q: any) => q.quizId.toString() === quizId.toString());

    if (foundQuiz) {
        let moduleTitle = "Final Quiz";
        let lessonTitle = null;

        for (const module of course.modules || []) {
            if ((module.quizzes || []).some((q: any) => q.quizId.toString() === quizId.toString())) {
                moduleTitle = module.title;
                break;
            }
            for (const lesson of module.lessons || []) {
                if ((lesson.quizzes || []).some((q: any) => q.quizId.toString() === quizId.toString())) {
                    moduleTitle = module.title;
                    lessonTitle = lesson.title;
                    break;
                }
            }
        }
        return { courseName: course.name, moduleTitle, lessonTitle, quiz: foundQuiz };
    }
    return null;
};


const QuizSubmissions: FC<Props> = ({ courseId }) => {
  const { data, isLoading, refetch } = useGetQuizSubmissionsQuery(courseId, { refetchOnMountOrArgChange: true });
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({}, { refetchOnMountOrArgChange: true });
  const [deleteQuizSubmission, { isSuccess: deleteSuccess, error: deleteError }] = useDeleteQuizSubmissionMutation();
  const [updateQuizSubmissionScore, { isSuccess: updateSuccess, error: updateError }] = useUpdateQuizSubmissionScoreMutation();

  const [open, setOpen] = useState(false);
  // MODIFICATION: State to hold all data needed by the modal
  const [modalData, setModalData] = useState<{ submission: any, details: any } | null>(null);
  const [editScore, setEditScore] = useState<{ id: string | null; value: number }>({ id: null, value: 0 });

  useEffect(() => {
    if (deleteSuccess) { toast.success("Submission deleted successfully"); refetch(); }
    if (deleteError) { toast.error((deleteError as any).data.message); }
    if (updateSuccess) { toast.success("Score updated successfully"); setEditScore({ id: null, value: 0 }); refetch(); }
    if (updateError) { toast.error((updateError as any).data.message); }
  }, [deleteSuccess, deleteError, updateSuccess, updateError, refetch]);
  
  let groupedData = {};
  if (data?.submissions && coursesData?.courses) {
      const groupQuizSubmissions = (submissions: any[], allCourses: any[]) => {
          if (!submissions || !allCourses) return {};
          return submissions.reduce((acc: any, sub: any) => {
             if (!sub.userId) {
                return acc; // Skip this submission if the user was deleted.
              }
              const course = allCourses.find((c: any) => c._id.toString() === sub.courseId.toString());
              if (!course) return acc;
              
              const context = findQuizContext(course, sub.quizId);
              if (!context || !context.quiz) return acc;

              const userId = sub.userId._id;
              if (!acc[userId]) acc[userId] = { userName: sub.userId.name, username: sub.userId.username, courses: {} };
              if (!acc[userId].courses[course._id]) acc[userId].courses[course._id] = { courseName: course.name, modules: {}, finalQuizzes: [] };
              
              const submissionData = { ...sub, quizTitle: context.quiz.title };

              if (context.moduleTitle === 'Final Quiz') {
                  acc[userId].courses[course._id].finalQuizzes.push(submissionData);
              } else {
                  const moduleId = context.moduleTitle;
                  if (!acc[userId].courses[course._id].modules[moduleId]) {
                      acc[userId].courses[course._id].modules[moduleId] = { moduleTitle: moduleId, lessonQuizzes: {}, moduleQuizzes: [] };
                  }
                  if (context.lessonTitle) {
                      const lessonId = context.lessonTitle;
                      if (!acc[userId].courses[course._id].modules[moduleId].lessonQuizzes[lessonId]) {
                          acc[userId].courses[course._id].modules[moduleId].lessonQuizzes[lessonId] = { lessonTitle: lessonId, quizzes: [] };
                      }
                      acc[userId].courses[course._id].modules[moduleId].lessonQuizzes[lessonId].quizzes.push(submissionData);
                  } else {
                      acc[userId].courses[course._id].modules[moduleId].moduleQuizzes.push(submissionData);
                  }
              }
              return acc;
          }, {});
      };
      groupedData = groupQuizSubmissions(data.submissions, coursesData.courses);
  }


  const handleDelete = (submissionId: string) => {
      if (window.confirm("Are you sure? This action cannot be undone.")) { deleteQuizSubmission(submissionId); }
  };

  const handleUpdateScore = () => {
      if (editScore.id) { updateQuizSubmissionScore({ submissionId: editScore.id, score: editScore.value }); }
  };

  // THE DEFINITIVE FIX: Find the details first, then set the state to open the modal.
  const handleViewDetails = (submission: any) => {
      const course = coursesData.courses.find((c: any) => c._id.toString() === submission.courseId.toString());
      if (course) {
          const details = findQuizContext(course, submission.quizId);
          setModalData({ submission, details });
          setOpen(true);
      } else {
          toast.error("Could not find course details for this submission.");
      }
  };

  if (isLoading || coursesLoading) return <Loader />;

  return (
    <div className="mt-[120px] p-5">
      <h1 className={`${styles.title}`}>Quiz Submissions</h1>
      
      {Object.keys(groupedData).length > 0 ? (
        Object.values(groupedData).map((user: any, index: number) => (
          <Box key={index} className="p-4 my-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <Typography variant="h5" className="!font-bold !mb-3 dark:text-white text-black">{user.username}</Typography>
              {Object.values(user.courses).map((course: any, cIndex: number) => (
                  <Box key={cIndex} className="p-3 my-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-slate-700">
                      <Typography variant="h6" className="!font-semibold !mb-2 dark:text-gray-200 text-gray-800">{course.courseName}</Typography>
                      {Object.values(course.modules).map((module: any, mIndex: number) => (
                          <Box key={mIndex} className="p-2 my-1 border-l-4 border-blue-500 dark:border-blue-400">
                              <Typography className="!font-medium dark:text-gray-300 text-gray-700">{module.moduleTitle}</Typography>
                              {(module.moduleQuizzes || []).map((sub: any, mqIndex: number) => <QuizSubmissionItem key={mqIndex} submission={sub} onEdit={setEditScore} onView={handleViewDetails} editScore={editScore} onDelete={handleDelete} onUpdateScore={handleUpdateScore} />)}
                              {Object.values(module.lessonQuizzes).map((lesson: any, lqIndex: number) => (
                                  <Box key={lqIndex} className="ml-4 mt-2">
                                      <Typography className="italic dark:text-gray-400 text-gray-600">Lesson: {lesson.lessonTitle}</Typography>
                                      {lesson.quizzes.map((sub: any, qIndex: number) => <QuizSubmissionItem key={qIndex} submission={sub} onEdit={setEditScore} onView={handleViewDetails} editScore={editScore} onDelete={handleDelete} onUpdateScore={handleUpdateScore} />)}
                                  </Box>
                              ))}
                          </Box>
                      ))}
                      {course.finalQuizzes.length > 0 && (
                          <Box className="p-2 my-1 border-l-4 border-red-500 dark:border-red-400">
                              <Typography className="!font-medium dark:text-gray-300 text-gray-700">Final Quizzes</Typography>
                              {course.finalQuizzes.map((sub: any, fqIndex: number) => <QuizSubmissionItem key={fqIndex} submission={sub} onEdit={setEditScore} onView={handleViewDetails} editScore={editScore} onDelete={handleDelete} onUpdateScore={handleUpdateScore} />)}
                          </Box>
                      )}
                  </Box>
              ))}
          </Box>
        ))
      ) : (
        <Typography className="text-center mt-10">No quiz submissions for this course.</Typography>
      )}

      {open && modalData && modalData.details && modalData.details.quiz && (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[800px] h-[80vh] bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 overflow-y-auto">
                <Typography variant="h5" className="!font-bold !mb-4">Submission Details</Typography>
                <p><strong>Student:</strong> {modalData.submission.userId.name}</p>
                <p><strong>Course:</strong> {modalData.details.courseName}</p>
                <p><strong>Section:</strong> {modalData.details.moduleTitle}{modalData.details.lessonTitle && ` > ${modalData.details.lessonTitle}`}</p>
                <p><strong>Quiz:</strong> {modalData.details.quiz.title}</p>
                <Box className="flex items-center gap-2">
                    <strong>Score:</strong>
                    {editScore.id === modalData.submission._id ? (
                        <>
                           <TextField type="number" size="small" value={editScore.value} onChange={(e) => setEditScore({...editScore, value: parseInt(e.target.value) || 0})} sx={{ width: '80px', '& .MuiInputBase-input': { py: '4px' } }} />
                           <Typography>/ {modalData.submission.totalQuestions}</Typography>
                           <Button size="small" onClick={handleUpdateScore}>Save</Button>
                           <Button size="small" color="inherit" onClick={() => setEditScore({id: null, value: 0})}>Cancel</Button>
                        </>
                    ) : (
                        <>
                           <p>{modalData.submission.score} / {modalData.submission.totalQuestions}</p>
                           <IconButton size="small" onClick={() => setEditScore({ id: modalData.submission._id, value: modalData.submission.score })}>
                               <EditIcon fontSize="inherit" />
                           </IconButton>
                        </>
                    )}
                </Box>
                <hr className="my-4 border-gray-300 dark:border-gray-600"/>
                
                <Typography variant="h6" className="!font-semibold !mb-2">Student's Answers:</Typography>
                {modalData.details.quiz.questions.map((q: any, index: number) => {
                    const userAnswer = modalData.submission.answers.find((a: any) => a.questionId === q._id);
                    return (
                        <Box key={index} className="my-3 p-3 rounded-md bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                            <Typography className="!font-semibold">{index + 1}. {q.questionText}</Typography>
                            {q.options.map((opt: any, optIndex: number) => {
                                const isUserAnswer = userAnswer?.selectedOption === opt.optionText;
                                const isTheCorrectAnswer = q.correctAnswer === opt.optionText;
                                return (
                                    <Typography key={optIndex} className={` ml-4 p-1 my-1 rounded
                                        ${isTheCorrectAnswer ? 'bg-green-200 dark:bg-green-800/60 font-bold' : ''}
                                        ${isUserAnswer && !isTheCorrectAnswer ? 'bg-red-200 dark:bg-red-800/60' : ''}
                                    `}>
                                        {opt.optionText}
                                        {isUserAnswer && !isTheCorrectAnswer && <span> (Selected)</span>}
                                        {isTheCorrectAnswer && <span> (Correct)</span>}
                                    </Typography>
                                );
                            })}
                             {!userAnswer && <Typography className="ml-4 p-1 my-1 text-gray-500 italic">(Not Answered)</Typography>}
                        </Box>
                    );
                })}
                <Box className="flex justify-end mt-5">
                    <Button variant="contained" onClick={() => setOpen(false)}>Close</Button>
                </Box>
            </Box>
        </Modal>
      )}
    </div>
  );
};

const QuizSubmissionItem: FC<{submission: any, editScore: any, onEdit: any, onView: any, onDelete: (id: string) => void, onUpdateScore: () => void}> = ({ submission, editScore, onEdit, onView, onDelete, onUpdateScore }) => (
    <Box className="flex items-center justify-between ml-4 mt-2 p-2 rounded bg-white dark:bg-slate-800/50 flex-wrap">
        <Typography>{submission.quizTitle}</Typography>
        <Box className="flex items-center gap-1 flex-wrap">
            {editScore.id === submission._id ? (
                <>
                   <TextField type="number" size="small" value={editScore.value} onChange={(e) => onEdit({...editScore, value: parseInt(e.target.value) || 0})} sx={{ width: '70px', '& .MuiInputBase-input': { py: '4px' } }} />
                   <Typography>/ {submission.totalQuestions}</Typography>
                   <Button size="small" variant="contained" onClick={onUpdateScore}>Save</Button>
                   <Button size="small" color="inherit" onClick={() => onEdit({id: null, value: 0})}>X</Button>
                </>
            ) : (
                <>
                   <Typography><strong>Score:</strong> {submission.score} / {submission.totalQuestions}</Typography>
                   <IconButton size="small" onClick={() => onEdit({ id: submission._id, value: submission.score })}><EditIcon fontSize="inherit" /></IconButton>
                </>
            )}
            <IconButton size="small" onClick={() => onView(submission)}><VisibilityIcon /></IconButton>
            <IconButton size="small" onClick={() => onDelete(submission._id)}><DeleteIcon className="text-red-500" /></IconButton>
        </Box>
    </Box>
);

export default QuizSubmissions;