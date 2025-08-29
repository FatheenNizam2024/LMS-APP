// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Course\CourseEnrollments.tsx

"use client";
import React, { FC, useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";
import { useTheme } from "next-themes";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
// MODIFICATION: Import the correct hooks
import { useGetAllStudentsQuery, useUpdateStudentEnrollmentMutation } from "@/redux/features/user/userApi";
import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { toast } from "react-hot-toast";

type Props = {
  courseId: string;
};

const CourseEnrollments: FC<Props> = ({ courseId }) => {
  const { theme } = useTheme();
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({});
  // MODIFICATION: Use the correct hook to fetch students
  const { data: studentsData, isLoading: studentsLoading, refetch } = useGetAllStudentsQuery({});
  const [updateUserEnrollment, { isSuccess, error }] = useUpdateStudentEnrollmentMutation();

  const [course, setCourse] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (coursesData && coursesData.courses) {
      const currentCourse = coursesData.courses.find((c: any) => c._id === courseId);
      setCourse(currentCourse);
    }
  }, [coursesData, courseId]);

  useEffect(() => {
    if (studentsData && studentsData.students) {
      const newRows = studentsData.students.map((item: any) => ({
          id: item._id,
          name: item.username,
          email: item.email,
          courses: (item.courses || []).map((c: any) => c._id),
        }));
      setRows(newRows);
    }
  }, [studentsData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("User enrollment updated successfully.");
      refetch(); // Refetch the student list to get updated course arrays
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [isSuccess, error, refetch]);

  const handleEnrollmentToggle = async (userId: string) => {
    await updateUserEnrollment({ userId, courseId });
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 0.5 },
    { field: "email", headerName: "Email", flex: 0.8 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.4,
      renderCell: (params: any) => {
        const isEnrolled = (params.row.courses || []).includes(courseId);
        return (
          <Box color={isEnrolled ? "green" : "red"}>
            {isEnrolled ? "Enrolled" : "Not Enrolled"}
          </Box>
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      flex: 0.4,
      renderCell: (params: any) => {
        const isEnrolled = (params.row.courses || []).includes(courseId);
        return (
          <Button
            variant="contained"
            color={isEnrolled ? "error" : "success"}
            onClick={() => handleEnrollmentToggle(params.id)}
            size="small"
          >
            {isEnrolled ? "Unenroll" : "Enroll"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="mt-[120px]">
      {coursesLoading || studentsLoading ? (
        <Loader />
      ) : (
        <Box m="20px">
          <h1 className={`${styles.title}`}>Enrollment for: {course?.name}</h1>
          <Box
            m="40px 0 0 0"
            height="80vh"
            sx={{
              "& .MuiDataGrid-root": { border: "none", outline: "none" },
              "& .MuiDataGrid-columnHeaders": { backgroundColor: theme === "dark" ? "#3e4396" : "#A4A9FC" },
            }}
          >
            <DataGrid checkboxSelection rows={rows} columns={columns} />
          </Box>
        </Box>
      )}
    </div>
  );
};

export default CourseEnrollments;