"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import Cookies from 'js-cookie';
import avatarDefault from "../../../../public/assests/avatar.png";
import { Box, Modal, Button, Typography, CircularProgress } from "@mui/material";
import { AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-hot-toast";

const serverUri = process.env.NEXT_PUBLIC_SERVER_URI || "";
const accessToken = Cookies.get("accessToken");

interface Props {
  student: any; // Pass the whole student object
  onAvatarChange: () => void; // Callback to refetch the student list
}

const UserAvatar = ({ student, onAvatarChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (student.avatar && student.avatar.public_id) {
        setLoading(true);
        try {
          const res = await axios.get(`${serverUri}/get-avatar-url`, {
            params: { objectName: student.avatar.public_id },
            headers: { 'access-token': accessToken }
          });
          setAvatarUrl(res.data.url);
        } catch (error) {
          console.error("Failed to fetch avatar URL", error);
          setAvatarUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        setAvatarUrl(null);
        setLoading(false);
      }
    };
    fetchAvatarUrl();
  }, [student.avatar]);
  
  const handleDeleteAvatar = async () => {
      if (!confirm("Are you sure you want to remove this student's profile picture?")) return;
      
      const toastId = toast.loading("Removing avatar...");
      try {
          await axios.delete(
              `${serverUri}/admin/delete-student-avatar/${student._id}`,
              { headers: { 'access-token': accessToken } }
          );
          toast.success("Avatar removed successfully!", { id: toastId });
          setOpen(false);
          onAvatarChange(); // Trigger refetch in the parent component
      } catch (error: any) {
          toast.error(error.response?.data?.message || "Failed to remove avatar.", { id: toastId });
      }
  };

  const defaultAvatar = 'https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png';


  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: avatarUrl ? 'pointer' : 'not-allowed', pointerEvents: avatarUrl ? 'auto' : 'none' }}>
        {loading ? (
            <CircularProgress size={40} />
        ) : (
            <img
                src={avatarUrl || defaultAvatar}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover cursor-pointer border-2 border-gray-300"
            />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 w-[90%] md:w-[500px]"
        >
          <Typography variant="h5" className="text-center mb-4">
            {student.name}'s Avatar
          </Typography>
          <img
            src={avatarUrl || defaultAvatar}
            alt="Student Avatar"
            className="w-full h-auto max-h-[70vh] object-contain rounded"
          />
          <Box className="flex justify-end mt-4">
            <Button
              variant="contained"
              color="error"
              startIcon={<AiOutlineDelete />}
              onClick={handleDeleteAvatar}
            >
              Remove Picture
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default UserAvatar;