"use client";
import React, { FC, useEffect, useState, useMemo } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useGetAllStudentsQuery, useAdminCreateStudentMutation, useAdminUpdateStudentMutation, useAdminDeleteStudentMutation } from "@/redux/features/user/userApi";
import Loader from "../../Loader/Loader";
import { styles } from "@/app/styles/style";
import { toast } from "react-hot-toast";
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import UserAvatar from "./UserAvatar";
import EnrollmentManager from "./EnrollmentManager";
import EditIcon from '@mui/icons-material/Edit';

const StudentCard = ({ student, onSave, onDelete, onAvatarChange }: { student: any, onSave: (data: any) => void, onDelete: (id: string) => void, onAvatarChange: () => void }) => {
    const [isEditing, setIsEditing] = useState(!student._id);
    const [data, setData] = useState({ ...student, password: "" });
    const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

    const handleSave = () => { onSave(data); if(student._id) setIsEditing(false); };
    const handleCancel = () => {
        if(student._id){ setData({ ...student, password: "" }); setIsEditing(false); } 
        else { onDelete("new"); }
    };
    
    if(!isEditing){
        return (
            <>
            <Box className="p-4 bg-white dark:bg-slate-800 rounded-md shadow-sm my-2 flex justify-between items-center">
                <Box className="flex items-center gap-4">
                    
                    <UserAvatar student={student} onAvatarChange={onAvatarChange} />
                <Box>
                    <Typography><strong>Name:</strong> {data.name}</Typography>
                    <Typography><strong>Email:</strong> {data.email}</Typography>
                    <Typography><strong>Username:</strong> {data.username}</Typography>
                </Box>
                </Box>
                <Box sx={{ mt: 1 }}>
                        <Typography><strong>Enrolled Courses:</strong></Typography>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => setEnrollmentModalOpen(true)}>
                                Edit
                            </Button>
                        {data.courses && data.courses.length > 0 ? (
                            data.courses.map((course: any) => (
                                <Typography key={course._id} variant="body2" sx={{ ml: 2 }}>
                                    - {course.name}
                                </Typography>
                            ))
                        ) : (
                            <Typography variant="body2" sx={{ ml: 2, fontStyle: 'italic' }}>
                                Not enrolled in any courses.
                            </Typography>
                        )}
                    </Box>
                <Box>
                    <Button onClick={() => setIsEditing(true)}>Edit</Button>
                    <Button color="error" onClick={() => onDelete(data._id)}>Delete</Button>
                </Box>
            </Box>
            <EnrollmentManager 
                    student={student} 
                    open={enrollmentModalOpen} 
                    onClose={() => setEnrollmentModalOpen(false)}
                    onUpdate={onAvatarChange} // We can reuse the onAvatarChange prop, since it's just the 'refetch' function
                />
            </>
        );
    }

    return (
        <Box className="p-4 bg-white dark:bg-slate-800 rounded-md shadow-sm my-2 border-2 border-blue-500">
            <TextField label="Full Name" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} fullWidth margin="dense" size="small" />
            <TextField label="Batch Number" value={data.batch} onChange={(e) => setData({...data, batch: e.target.value})} fullWidth margin="dense" size="small" />
            <TextField label="Email Address" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} fullWidth margin="dense" size="small" />
            <TextField label="Username" value={data.username} onChange={(e) => setData({...data, username: e.target.value})} fullWidth margin="dense" size="small" />
            <TextField label="Password (leave blank to keep unchanged)" type="password" value={data.password} onChange={(e) => setData({...data, password: e.target.value})} fullWidth margin="dense" size="small" />
            <Box className="flex justify-end gap-2 mt-2">
                <Button onClick={handleCancel} startIcon={<CancelIcon />}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Save</Button>
            </Box>
        </Box>
    );
};


const StudentProvisioning: FC = () => {
  const { isLoading, data: studentsData, refetch } = useGetAllStudentsQuery({});
  const [adminCreateStudent, { isSuccess: createSuccess, error: createError }] = useAdminCreateStudentMutation();
  const [adminUpdateStudent, { isSuccess: updateSuccess, error: updateError }] = useAdminUpdateStudentMutation();
  const [adminDeleteStudent, { isSuccess: deleteSuccess, error: deleteError }] = useAdminDeleteStudentMutation();
  
  const [newStudents, setNewStudents] = useState<any[]>([]);

  useEffect(() => {
      if (createSuccess || updateSuccess || deleteSuccess) {
          toast.success("Operation successful!");
          setNewStudents([]);
          refetch();
      }
      const error = createError || updateError || deleteError;
      if (error) {
          if ("data" in error) {
              const errorMessage = error as any;
              toast.error(errorMessage.data.message);
          }
      }
  }, [createSuccess, updateSuccess, deleteSuccess, createError, updateError, deleteError, refetch]);

  const studentsByBatch = useMemo(() => {
    if (!studentsData || !studentsData.students) {
      return {}; // Return empty object if data is not available
    }
    const allStudents = [...(studentsData?.students || []), ...newStudents];
    return allStudents.reduce((acc, student) => {
        const batch = student.batch || "Uncategorized";
        if (!acc[batch]) { acc[batch] = []; }
        acc[batch].push(student);
        return acc;
    }, {});
  }, [studentsData, newStudents]);

  const handleAddNewStudent = (batch: string) => {
      setNewStudents(prev => [...prev, {
          name: "", batch: batch === 'Uncategorized' ? "" : batch, email: "", username: "", password: ""
      }]);
  };

  const handleSaveStudent = (studentData: any) => {
      if (studentData._id) {
          adminUpdateStudent({id: studentData._id, ...studentData});
      } else {
          adminCreateStudent(studentData);
      }
  };

  const handleDeleteStudent = (studentId: string) => {
      if (studentId === "new") {
          setNewStudents(prev => prev.slice(0, prev.length -1));
          return;
      }
      if(window.confirm("Are you sure you want to delete this student?")){
          adminDeleteStudent(studentId);
      }
  };

  return (
    <div className="mt-[120px] p-5">
      {isLoading ? <Loader /> : (
        <>
            <Box className="flex justify-between items-center">
                <h1 className={`${styles.title} !text-left`}>Student Provisioning</h1>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleAddNewStudent("Uncategorized")}>
                    Add New Student
                </Button>
            </Box>
            {Object.keys(studentsByBatch).sort().map(batch => (
                <Box key={batch} className="my-6">
                    <Typography variant="h5" className="border-b-2 border-gray-300 dark:border-gray-600 pb-2 mb-2">
                        Batch: {batch}
                    </Typography>
                    {studentsByBatch[batch].map((student: any) => (
                        <StudentCard 
                            key={student._id || student.email} 
                            student={student} 
                            onSave={handleSaveStudent} 
                            onDelete={handleDeleteStudent}
                            onAvatarChange={refetch} // Pass the refetch function down
                        />
                    ))}
                    {batch !== 'Uncategorized' && (
                        <Button startIcon={<AddIcon />} onClick={() => handleAddNewStudent(batch)}>
                            Add Student to Batch {batch}
                        </Button>
                    )}
                </Box>
            ))}
        </>
      )}
    </div>
  );
};

export default StudentProvisioning;