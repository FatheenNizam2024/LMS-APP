"use client";
import DashboardHero from "@/app/components/Admin/DashboardHero";
import AdminProtected from "@/app/hooks/adminProtected";
import Heading from "@/app/utils/Heading";
import React from "react";
import AdminSidebar from "../../components/Admin/sidebar/AdminSidebar";
import StudentProvisioning from "../../components/Admin/Users/StudentProvisioning"; // Import the new component

const page = () => {
  return (
    <div>
      <AdminProtected>
        <Heading
          title="Elearning - Student Provisioning"
          description="Create and manage student accounts"
          keywords="Students, Management, Provisioning"
        />
        <div className="flex min-h-screen">
          <div className="1500px:w-[16%] w-1/5">
            <AdminSidebar />
          </div>
          <div className="w-[85%]">
            <DashboardHero />
            <StudentProvisioning />
          </div>
        </div>
      </AdminProtected>
    </div>
  );
};
export default page;