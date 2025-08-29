"use client";
import React, { useState, useEffect } from 'react';
import { Box, Modal, Button, Typography, List, ListItem, ListItemText, Checkbox, CircularProgress } from '@mui/material';
import { useGetAllCoursesQuery } from '@/redux/features/courses/coursesApi';
import { useUpdateStudentEnrollmentMutation } from '@/redux/features/user/userApi';
import { toast } from 'react-hot-toast';

interface Props {
  student: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void; // Callback to refetch student list
}

const EnrollmentManager = ({ student, open, onClose, onUpdate }: Props) => {
  const { data: coursesData, isLoading: coursesLoading } = useGetAllCoursesQuery({});
  const [updateStudentEnrollment, { isLoading: isUpdating }] = useUpdateStudentEnrollmentMutation();
  
  // State to hold the IDs of the courses the student is currently enrolled in
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // When the component receives a student, populate the enrolled IDs
    if (student && student.courses) {
      setEnrolledIds(new Set(student.courses.map((c: any) => c._id)));
    }
  }, [student]);

  const handleToggleEnrollment = async (courseId: string) => {
    // This function is called for each checkbox change and immediately calls the API
    try {
      await updateStudentEnrollment({ userId: student._id, courseId }).unwrap();
      toast.success('Enrollment updated!');
      onUpdate(); // Trigger refetch in the parent component
      
      // Manually update local state for immediate UI feedback
      setEnrolledIds(prev => {
          const newIds = new Set(prev);
          if (newIds.has(courseId)) {
              newIds.delete(courseId);
          } else {
              newIds.add(courseId);
          }
          return newIds;
      });

    } catch (error) {
      toast.error('Failed to update enrollment.');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-[90%] md:w-[600px] max-h-[80vh] overflow-y-auto">
        <Typography variant="h5" className="mb-4">
          Manage Enrollments for {student?.name}
        </Typography>
        
        {coursesLoading ? <CircularProgress /> : (
          <List>
            {coursesData?.courses?.map((course: any) => (
              <ListItem 
                key={course._id}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    onChange={() => handleToggleEnrollment(course._id)}
                    checked={enrolledIds.has(course._id)}
                    disabled={isUpdating}
                  />
                }
                disablePadding
              >
                <ListItemText primary={course.name} />
              </ListItem>
            ))}
          </List>
        )}

        <Box className="flex justify-end mt-6">
          <Button onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EnrollmentManager;