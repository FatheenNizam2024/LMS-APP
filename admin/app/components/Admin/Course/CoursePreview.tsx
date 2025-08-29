// C:\Lms-App - Copy\admin\app\components\Admin\Course\CoursePreview.tsx

import React, { FC } from "react";
import CoursePlayer from "../../../utils/CoursePlayer"; // This will need a dummy video URL for preview
import { styles } from "../../../../app/styles/style";

type Props = {
  active: number;
  setActive: (active: number) => void;
  courseData: any;
  handleCourseCreate: any;
  isEdit?: boolean;
};

const CoursePreview: FC<Props> = ({
  courseData,
  handleCourseCreate,
  setActive,
  active,
  isEdit,
}) => {
  const prevButton = () => {
    setActive(active - 1);
  };

  const createCourse = () => {
    handleCourseCreate();
  };

  return (
    <div className="w-[90%] m-auto py-5 mb-5">
      <div className="w-full relative">
        <h1 className={`${styles.title} !text-left`}>Course Preview</h1>
        
        {/* Course Name and Description */}
        <div className="mt-5">
            <h2 className="text-[22px] font-Poppins font-[600] dark:text-white text-black">{courseData?.name}</h2>
            <p className="text-[16px] mt-2 dark:text-gray-300 text-gray-800 whitespace-pre-line">
                {courseData?.description}
            </p>
        </div>
        <br />
        <h3 className="text-[20px] font-Poppins font-[500] dark:text-white text-black">Course Content Structure</h3>
        <br />

        {/* Render the new hierarchical content */}
        {courseData?.modules?.map((module: any, moduleIndex: number) => (
            <div key={moduleIndex} className="mb-4 p-3 border rounded">
                <h4 className="text-lg font-bold">{module.title || `Module ${moduleIndex + 1}`}</h4>
                {module.sections?.map((section: any, sectionIndex: number) => (
                    <div key={sectionIndex} className="ml-4 mt-2 p-2 border-l-2">
                        <h5 className="text-md font-semibold">{section.title || `Section ${sectionIndex + 1}`}</h5>
                        {section.lessons?.map((lesson: any, lessonIndex: number) => (
                           <p key={lessonIndex} className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                               - {lesson.title || `Lesson ${lessonIndex + 1}`} 
                           </p> 
                        ))}
                    </div>
                ))}
            </div>
        ))}
      </div>
      
      <br />
      <br />

      {/* Navigation Buttons */}
      <div className="w-full flex items-center justify-between">
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-gray-500 text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => prevButton()}
        >
          Prev
        </div>
        <div
          className="w-full 800px:w-[180px] flex items-center justify-center h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          onClick={() => createCourse()}
        >
          {isEdit ? "Update Course" : "Create Course"}
        </div>
      </div>
    </div>
  );
};

export default CoursePreview;