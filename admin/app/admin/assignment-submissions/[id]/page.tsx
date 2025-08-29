'use client'
import React from 'react'
import AdminSidebar from "../../../../app/components/Admin/sidebar/AdminSidebar";
import Heading from '../../../../app/utils/Heading';
import DashboardHeader from '../../../../app/components/Admin/DashboardHeader';
import AssignmentSubmissions from '../../../../app/components/Admin/Submissions/AssignmentSubmissions';

type Props = { 
    params: { id: string } // More specific type for params
}

const page = ({params}:any) => {
    const id = params?.id;

  return (
    <div>
        <Heading
         title="Elearning - Assignment Submissions"
         description="View student assignment submissions"
         keywords="Assignments, Submissions, Grading"
        />
        <div className="flex">
            <div className="1500px:w-[16%] w-1/5">
                <AdminSidebar />
            </div>
            <div className="w-[85%]">
               <DashboardHeader />
               <AssignmentSubmissions courseId={id} />
            </div>
        </div>
    </div>
  )
}

export default page;