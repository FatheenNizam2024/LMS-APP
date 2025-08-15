// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Submissions\AssignmentSubmissions.tsx

"use client";
import React, { FC, useEffect, useState, useMemo } from "react";
import { useGetAssignmentSubmissionsQuery } from "@/redux/features/submissions/submissionsApi";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
//import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { Box, Link } from "@mui/material";

type Props = {
  courseId: string;
};

// Group submissions by user, then by course
const groupSubmissions = (submissions: any[], courses: any[]) => {
  if (!submissions || !courses) return {};

  const groupedByUser = submissions.reduce((acc, sub) => {
    const userId = sub.userId._id;
    if (!acc[userId]) {
      acc[userId] = {
        userName: sub.userId.name,
        courses: {},
      };
    }
    
    const course = courses.find(c => c._id === sub.courseId);
    if (!course) return acc;

    if (!acc[userId].courses[sub.courseId]) {
      acc[userId].courses[sub.courseId] = {
        courseName: course.name,
        moduleAssignments: [],
        finalAssignments: [],
      };
    }
    
    // Find the assignment title
    let assignmentTitle = "Unknown Assignment";
    let isFinal = true;

    for (const module of course.modules) {
        const foundAssignment = module.assignments.find((a:any) => a.assignmentId === sub.assignmentId);
        if (foundAssignment) {
            assignmentTitle = foundAssignment.title;
            isFinal = false;
            break;
        }
    }
    if (isFinal) {
        const foundFinal = course.finalAssignments.find((a:any) => a.assignmentId === sub.assignmentId);
        if (foundFinal) assignmentTitle = foundFinal.title;
    }
    
    const submissionData = {
        title: assignmentTitle,
        link: sub.content.url,
    };
    
    if (isFinal) {
        acc[userId].courses[sub.courseId].finalAssignments.push(submissionData);
    } else {
        acc[userId].courses[sub.courseId].moduleAssignments.push(submissionData);
    }

    return acc;
  }, {});

  return groupedByUser;
};

const AssignmentSubmissions: FC<Props> = ({ courseId }) => {
  const { data, isLoading, error } = useGetAssignmentSubmissionsQuery(courseId);
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({});
  
  const groupedData = useMemo(() => {
      if(data && coursesData){
          return groupSubmissions(data.submissions, coursesData.courses);
      }
      return {};
  }, [data, coursesData]);


//   if (isLoading || coursesLoading) {
//     return <Loader />;
//   }

  return (
    <div className="mt-[120px] p-5">
      <h1 className={`${styles.title}`}>Assignment Submissions</h1>
      
      {Object.values(groupedData).map((user: any, index: number) => (
          <Box key={index} className="p-4 my-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3 dark:text-white text-black">{user.userName}</h2>
              {Object.values(user.courses).map((course: any, cIndex: number) => (
                  <Box key={cIndex} className="p-3 my-2 border dark:border-gray-600 rounded">
                      <h3 className="text-lg font-semibold mb-2 dark:text-gray-200 text-gray-800">{course.courseName}</h3>
                      
                      {course.moduleAssignments.length > 0 && (
                          <div className="mb-2">
                              <h4 className="font-medium underline dark:text-gray-300 text-gray-700">Module Assignments:</h4>
                              {course.moduleAssignments.map((asm: any, aIndex: number) => (
                                  <div key={aIndex} className="ml-4 mt-1">
                                      <span className="dark:text-gray-400 text-gray-600">{asm.title}: </span>
                                      <Link href={asm.link} target="_blank" rel="noopener noreferrer">{asm.link}</Link>
                                  </div>
                              ))}
                          </div>
                      )}

                      {course.finalAssignments.length > 0 && (
                          <div>
                              <h4 className="font-medium underline dark:text-gray-300 text-gray-700">Final Assignments:</h4>
                              {course.finalAssignments.map((asm: any, aIndex: number) => (
                                  <div key={aIndex} className="ml-4 mt-1">
                                      <span className="dark:text-gray-400 text-gray-600">{asm.title}: </span>
                                      <Link href={asm.link} target="_blank" rel="noopener noreferrer">{asm.link}</Link>
                                  </div>
                              ))}
                          </div>
                      )}
                  </Box>
              ))}
          </Box>
      ))}

      {Object.keys(groupedData).length === 0 && (
          <p className="text-center mt-10">No assignment submissions for this course yet.</p>
      )}
    </div>
  );
};

export default AssignmentSubmissions;