// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Users\AllUsers.tsx

"use client";
import React, { FC, useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Button, Modal } from "@mui/material";
import { AiOutlineDelete, AiOutlineMail } from "react-icons/ai";
import { useTheme } from "next-themes";
import Loader from "../../Loader/Loader";
import { format } from "timeago.js";
// MODIFICATION: Import the correct, existing hooks
import {
  useGetAllAdminsQuery,
  //useGetAllStudentsQuery
  // We need to decide what to do with updateUserRole and deleteUser. For now, let's assume they operate on Admins.
  // We will need corresponding server routes for these if they are to work on the Admin model.
} from "@/redux/features/user/userApi";
import { styles } from "@/app/styles/style";
import { toast } from "react-hot-toast";
import UserAvatar from "./UserAvatar";

type Props = {
  isTeam?: boolean; // This prop seems to differentiate between all admins and just "team"
};

const AllUsers: FC<Props> = ({ isTeam }) => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");

  // MODIFICATION: Use the correct hook
  const { isLoading, data, refetch } =   useGetAllAdminsQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  // NOTE: The delete/update role mutations are not defined for the Admin model yet.
  // We would need to create them on the server and in the Redux slice if this functionality is needed.
  // For now, these actions will likely fail if clicked.
  // const [updateUserRole, { error: updateError, isSuccess }] = useUpdateUserRoleMutation();
  // const [deleteUser, { isSuccess: deleteSuccess, error: deleteError }] = useDeleteUserMutation();
  
  // Placeholder for useEffect logic until mutations are defined
  useEffect(() => {
    //
  }, []);

  const columns = [
    { field: "id", headerName: "ID", flex: 0.3 },
    { field: "name", headerName: "Name", flex: 0.5 },
    { field: "email", headerName: "Email", flex: 0.5 },
    { field: "role", headerName: "Role", flex: 0.3 },
    { field: "courses", headerName: "Enrolled Courses", flex: 0.3 },
    { field: "created_at", headerName: "Joined At", flex: 0.5 },
    {
      field: "delete",
      headerName: "Delete",
      flex: 0.2,
      renderCell: (params: any) => (
        <Button onClick={() => { setOpen(!open); setUserId(params.row.id); }}>
          <AiOutlineDelete className="dark:text-white text-black" size={20} />
        </Button>
      ),
    },
    {
      field: "email_action",
      headerName: "Email",
      flex: 0.2,
      renderCell: (params: any) => (
        <a href={`mailto:${params.row.email}`}>
          <AiOutlineMail className="dark:text-white text-black" size={20} />
        </a>
      ),
    },
  ];

  const rows: any = [];
  const usersToDisplay = isTeam ? data?.users.filter((item: any) => item.role === "admin") : data?.users;

  if(usersToDisplay) {
    usersToDisplay.forEach((item: any) => {
        rows.push({
          id: item._id,
          avatar: item.avatar,
          name: item.name,
          email: item.email,
          role: item.role,
          courses: item.courses.length,
          created_at: format(item.createdAt),
        });
      });
  }

  const handleDelete = async () => {
    // This will fail until a deleteAdmin mutation is created
    // await deleteUser(userId);
    toast.error("Delete functionality for admins is not yet implemented.");
    setOpen(false);
  };

  return (
    <div className="mt-[120px]">
      {isLoading ? (
        <Loader />
      ) : (
        <Box m="20px">
          <Box
            m="40px 0 0 0"
            height="80vh"
            sx={{ /* your existing styles */ }}
          >
            <DataGrid checkboxSelection rows={rows} columns={columns} />
          </Box>
          {open && (
            <Modal open={open} onClose={() => setOpen(!open)}>
              <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[450px] bg-white dark:bg-slate-900 rounded-[8px] shadow p-4 outline-none">
                <h1 className={`${styles.title}`}>
                  Are you sure you want to delete this user?
                </h1>
                <div className="flex w-full items-center justify-between mb-6 mt-4">
                  <Button onClick={() => setOpen(!open)}>Cancel</Button>
                  <Button color="error" onClick={handleDelete}>Delete</Button>
                </div>
              </Box>
            </Modal>
          )}
        </Box>
      )}
    </div>
  );
};

export default AllUsers;