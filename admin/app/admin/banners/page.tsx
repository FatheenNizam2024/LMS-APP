"use client";
import React from "react";
import AdminSidebar from "../../components/Admin/sidebar/AdminSidebar";
import Heading from "@/app/utils/Heading";
import DashboardHeader from "@/app/components/Admin/DashboardHeader";
import BannerManager from "@/app/components/Admin/Customization/BannerManager"; // We will create this next

const BannersPage = () => {
  return (
    <div>
      <Heading
        title="Elearning - Manage Banners"
        description="Manage the homepage banner slider images"
        keywords="Banner, Slider, Images"
      />
      <div className="flex">
        <div className="1500px:w-[16%] w-1/5">
          <AdminSidebar />
        </div>
        <div className="w-[85%]">
          <DashboardHeader />
          <BannerManager />
        </div>
      </div>
    </div>
  );
};

export default BannersPage;