// C:\Lms-App - Copy\admin\app\components\Admin\Course\CourseEnrollments.tsx

"use client";
import React, { FC, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";
import { useTheme } from "next-themes";
import { useGetAllCoursesQuery } from "@/redux/features/courses/coursesApi";
import { useGetAllUsersQuery, useUpdateUserEnrollmentMutation } from "@/redux/features/user/userApi";
import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { toast } from "react-hot-toast";

type Props = {
  courseId: string;
};

const CourseEnrollments: FC<Props> = ({ courseId }) => {
  const { theme } = useTheme();
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({});
  const { data: usersData, isLoading: usersLoading } = useGetAllUsersQuery({});
  const [updateUserEnrollment, { isSuccess, error }] = useUpdateUserEnrollmentMutation();

  const [course, setCourse] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (coursesData) {
      const currentCourse = coursesData.courses.find((c: any) => c._id === courseId);
      setCourse(currentCourse);
    }
  }, [coursesData, courseId]);

  useEffect(() => {
    if (usersData) {
      const newRows = usersData.users
        .filter((user: any) => user.role === "user")
        .map((item: any) => ({
          id: item._id,
          name: item.name,
          email: item.email,
          courses: (item.courses || []),
        }));
      setRows(newRows);
    }
  }, [usersData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("User enrollment updated successfully.");
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [isSuccess, error]);

  const handleEnrollmentToggle = async (userId: string) => {
    await updateUserEnrollment({ userId, courseId });
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 0.5 },
    { field: "email", headerName: "Email", flex: 0.8 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.4,
      renderCell: (params: any) => {
        const isEnrolled = (params.row.courses || []).some((c: any) => c === courseId);
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
        const isEnrolled = (params.row.courses || []).some((c: any) => c === courseId);
        return (
          <Button
            variant="contained"
            color={isEnrolled ? "error" : "success"}
            onClick={() => handleEnrollmentToggle(params.id)}
          >
            {isEnrolled ? "Unenroll" : "Enroll"}
          </Button>
        );
      },
    },
  ];
  
  // The old 'const rows = []' declaration that was here is now GONE.

  return (
    <div className="mt-[120px]">
      {coursesLoading || usersLoading ? (
        <Loader />
      ) : (
        <Box m="20px">
          <h1 className={`${styles.title}`}>Enrollment for: {course?.name}</h1>
          <Box
            m="40px 0 0 0"
            height="80vh"
            sx={{
              // Add your custom DataGrid styles here if they were removed
              "& .MuiDataGrid-root": {
                border: "none",
                outline: "none",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme === "dark" ? "#3e4396" : "#A4A9FC",
              },
              // ...etc
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