'use client'
import React from 'react'
import AdminSidebar from "../../../components/Admin/sidebar/AdminSidebar";
import Heading from '../../../../app/utils/Heading';
import DashboardHeader from '../../../components/Admin/DashboardHeader';
import QuizSubmissions from '../../../components/Admin/Submissions/QuizSubmissions';

type Props = { }

const page = ({params}:any) => {
    const id = params?.id;

  return (
    <div>
        <Heading
         title="Elearning - Quiz Submissions"
         description="View student quiz submissions and results"
         keywords="Quiz, Submissions, Results, Grading"
        />
        <div className="flex">
            <div className="1500px:w-[16%] w-1/5">
                <AdminSidebar />
            </div>
            <div className="w-[85%]">
               <DashboardHeader />
               <QuizSubmissions courseId={id} />
            </div>
        </div>
    </div>
  )
}

export default page;