// MODIFICATION: Add "use client" at the very top
"use client";
import React from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardWidgets from "../../components/Admin/Widgets/DashboardWidgets";

type Props = {
  isDashboard?: boolean;
};

const DashboardHero = ({ isDashboard }: Props) => {
  // This component is now correctly identified as a client component,
  // so using state here is safe.
  return (
    <div>
      <DashboardHeader />
      {isDashboard && (
        <DashboardWidgets />
      )}
    </div>
  );
};

export default DashboardHero;