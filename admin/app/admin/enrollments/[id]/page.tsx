// C:\Lms-App - Copy\admin\app\admin\enrollments\[id]\page.tsx

'use client'
import React from 'react'
import AdminSidebar from "../../../components/Admin/sidebar/AdminSidebar";
import Heading from '../../../../app/utils/Heading';
import DashboardHeader from '../../../../app/components/Admin/DashboardHeader';
import CourseEnrollments from "../../../components/Admin/Course/CourseEnrollments";

type Props = {}

const page = ({params}:any) => {
  const id = params?.id;

  return (
    <div>
      <Heading
        title="Elearning - Admin Enrollments"
        description="ELearning is a platform for students to learn and get help from teachers"
        keywords="Enrollments, Management"
      />
      <div className="flex">
        <div className="1500px:w-[16%] w-1/5">
          <AdminSidebar />
        </div>
        <div className="w-[85%]">
          <DashboardHeader />
          {/* We pass the course ID down to our new component */}
          <CourseEnrollments courseId={id} />
        </div>
      </div>
    </div>
  )
}

export default page;