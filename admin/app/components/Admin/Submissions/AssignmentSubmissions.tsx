// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Submissions\AssignmentSubmissions.tsx

"use client";
import React, { FC, useMemo, useState, useEffect } from "react";
import { 
    useGetAssignmentSubmissionsQuery, 
    useDeleteAssignmentSubmissionMutation,
    useGradeAssignmentSubmissionMutation 
} from "@/redux/features/submissions/submissionsApi";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { Box, Link, Typography, IconButton, Modal, TextField, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { toast } from "react-hot-toast";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

type Props = {
  courseId: string;
};

// THE DEFINITIVE FIX: Ensure all ID comparisons are string-to-string
const groupSubmissions = (submissions: any[], allCourses: any[]) => {
  if (!submissions || !allCourses) return {};
  return submissions.reduce((acc, sub) => {
    if (!sub.userId) {
        return acc; // Skip this submission if the user was deleted.
    }
    const course = allCourses.find(c => c._id.toString() === sub.courseId.toString());
    if (!course) return acc;
    const userId = sub.userId._id;
    if (!acc[userId]) acc[userId] = { userName: sub.userId.name, username: sub.userId.username, courses: {} };
    if (!acc[userId].courses[course._id]) acc[userId].courses[course._id] = { courseName: course.name, moduleAssignments: [], finalAssignments: [] };
    let assignmentTitle = "Unknown Assignment";
    let isFinal = true;
    for (const module of (course.modules || [])) {
      const found = (module.assignments || []).find((a: any) => a.assignmentId.toString() === sub.assignmentId.toString());
      if (found) { assignmentTitle = found.title; isFinal = false; break; }
    }
    if (isFinal) {
      const found = (course.finalAssignments || []).find((a: any) => a.assignmentId.toString() === sub.assignmentId.toString());
      if (found) assignmentTitle = found.title;
    }
    const submissionData = { ...sub, title: assignmentTitle, link: sub.content.url };
    if (isFinal) acc[userId].courses[course._id].finalAssignments.push(submissionData);
    else acc[userId].courses[course._id].moduleAssignments.push(submissionData);
    return acc;
  }, {});
};

const AssignmentSubmissions: FC<Props> = ({ courseId }) => {
  const { data, isLoading, refetch } = useGetAssignmentSubmissionsQuery(courseId, { refetchOnMountOrArgChange: true });
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({}, { refetchOnMountOrArgChange: true });
  
  const [deleteAssignmentSubmission, { isSuccess: deleteSuccess, error: deleteError }] = useDeleteAssignmentSubmissionMutation();
  const [gradeAssignmentSubmission, { isSuccess: gradeSuccess, error: gradeError }] = useGradeAssignmentSubmissionMutation();

  const [open, setOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState("graded");

  useEffect(() => {
    if(deleteSuccess){ toast.success("Submission deleted successfully"); refetch(); }
    if(deleteError){ toast.error((deleteError as any).data.message); }
    if(gradeSuccess){ toast.success("Submission graded successfully"); setOpen(false); refetch(); }
    if(gradeError){ toast.error((gradeError as any).data.message); }
  }, [deleteSuccess, deleteError, gradeSuccess, gradeError, refetch]);
  
  const groupedData = useMemo(() => {

    // --- DEBUGGING STEP 1: LOG THE RAW DATA ---
      console.log("RAW SUBMISSIONS DATA:", JSON.stringify(data?.submissions, null, 2));
      console.log("RAW COURSES DATA:", JSON.stringify(coursesData?.courses, null, 2));
      // --- END DEBUGGING STEP ---
      if(data?.submissions && coursesData?.courses){
          return groupSubmissions(data.submissions, coursesData.courses);
      }
      return {};
  }, [data, coursesData]);

  const handleDelete = (submissionId: string) => {
      if(window.confirm("Are you sure you want to delete this submission?")){
          deleteAssignmentSubmission(submissionId);
      }
  };

  const handleGradeModalOpen = (submission: any) => {
      setSelectedSubmission(submission);
      setGrade(submission.grade || "");
      setFeedback(submission.feedback || "");
      setStatus(submission.status === 'pending' ? 'graded' : submission.status);
      setOpen(true);
  };

  const handleGradeSubmit = () => {
      if (!selectedSubmission) return;
      gradeAssignmentSubmission({
          submissionId: selectedSubmission._id,
          grade,
          feedback,
          status
      });
  };

  if (isLoading || coursesLoading) return <Loader />;

  return (
    <div className="mt-[120px] p-5">
      <h1 className={`${styles.title}`}>Assignment Submissions</h1>
      
      {Object.keys(groupedData).length > 0 ? (
        Object.values(groupedData).map((user: any, index: number) => (
          <Box key={index} className="p-4 my-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <Typography variant="h5" className="!font-bold !mb-3 dark:text-white text-black">{user.username}</Typography>
              {Object.values(user.courses).map((course: any, cIndex: number) => (
                  <Box key={cIndex} className="p-3 my-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-slate-700">
                      <Typography variant="h6" className="!font-semibold !mb-2 dark:text-gray-200 text-gray-800">{course.courseName}</Typography>
                      {course.moduleAssignments.length > 0 && (
                          <div className="mb-3">
                              <Typography className="!font-medium !underline dark:text-gray-300 text-gray-700">Module Assignments:</Typography>
                              {course.moduleAssignments.map((asm: any, aIndex: number) => (
                                  <SubmissionItem key={aIndex} submission={asm} onGrade={handleGradeModalOpen} onDelete={handleDelete} />
                              ))}
                          </div>
                      )}
                      {course.finalAssignments.length > 0 && (
                          <div>
                              <Typography className="!font-medium !underline dark:text-gray-300 text-gray-700">Final Assignments:</Typography>
                              {course.finalAssignments.map((asm: any, aIndex: number) => (
                                  <SubmissionItem key={aIndex} submission={asm} onGrade={handleGradeModalOpen} onDelete={handleDelete} />
                              ))}
                          </div>
                      )}
                  </Box>
              ))}
          </Box>
        ))
      ) : (
        <Typography className="text-center mt-10">No assignment submissions for this course.</Typography>
      )}

      <Modal open={open} onClose={() => setOpen(false)}>
          <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6">
              <Typography variant="h5" className="!font-bold !mb-4">Grade Submission</Typography>
              <TextField 
                label="Grade (e.g., A+, 85/100)"
                fullWidth value={grade} onChange={(e) => setGrade(e.target.value)} margin="normal"
              />
              <TextField 
                label="Feedback"
                fullWidth multiline rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="submitted">Submitted</MenuItem>
                    <MenuItem value="graded">Graded</MenuItem>
                    <MenuItem value="needs revision">Needs Revision</MenuItem>
                </Select>
              </FormControl>
              <Box className="flex justify-end mt-4 gap-4">
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button variant="contained" onClick={handleGradeSubmit}>Submit Grade</Button>
              </Box>
          </Box>
      </Modal>
    </div>
  );
};

const SubmissionItem: FC<{submission: any, onGrade: (sub: any) => void, onDelete: (id: string) => void}> = ({ submission, onGrade, onDelete }) => (
    <Box className="ml-4 mt-2 p-2 rounded bg-white dark:bg-slate-800/50 flex justify-between items-center flex-wrap">
        <Box className="flex-grow">
            <Typography>
                <span className="font-semibold">{submission.title}: </span>
                <Link href={submission.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">{submission.link}</Link>
            </Typography>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mt-1 capitalize">
                Status: <span className={
                    submission.status === 'graded' ? 'text-green-500' : 
                    submission.status === 'needs revision' ? 'text-red-500' : 'text-yellow-500'
                }>{submission.status}</span>
                {submission.status === 'graded' && ` | Grade: ${submission.grade}`}
            </Typography>
        </Box>
        <Box>
            <IconButton size="small" onClick={() => onGrade(submission)}>
                <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(submission._id)}>
                <DeleteIcon className="text-red-500" />
            </IconButton>
        </Box>
    </Box>
);

export default AssignmentSubmissions;