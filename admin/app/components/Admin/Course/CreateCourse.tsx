// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Course\CreateCourse.tsx

"use client";
import React, { useEffect, useState } from "react";
import CourseInformation from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CourseData from "./CourseData";
import CoursePreview from "./CoursePreview";
import { useCreateCourseMutation } from "../../../../redux/features/courses/coursesApi";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";

type Props = {};

const CreateCourse = (props: Props) => {
  const [createCourse, { isLoading, isSuccess, error }] = useCreateCourseMutation();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Course created successfully");
      redirect("/admin/courses");
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [isLoading, isSuccess, error]);

  const [active, setActive] = useState(0);

  const [courseInfo, setCourseInfo] = useState({
    name: "",
    description: "",
    price: "",
    estimatedPrice: "",
    thumbnail: "",
  });

  const [courseContent, setCourseContent] = useState({
    modules: [
      {
        title: "",
        lessons: [
          {
            title: "",
            videoUrl: "",
            resources: [{ title: "", file: "" }],
            quizzes: [],
          },
        ],
        assignments: [{ title: "", description: "" }],
        quizzes: [],
      },
    ],
    finalAssignments: [{ title: "", description: "" }],
    finalQuizzes: [],
  });

  const [courseData, setCourseData] = useState({});

  const handleSubmit = async () => {
    const courseContentCopy = JSON.parse(JSON.stringify(courseContent));

    // MODIFICATION: Robust recursive function to remove temporary frontend IDs
    const cleanTemporaryIds = (data: any) => {
      if (Array.isArray(data)) {
        data.forEach(cleanTemporaryIds);
      } else if (data && typeof data === 'object') {
        // Check for our temporary, numeric string IDs and delete them
        if (data._id && !data._id.match(/^[0-9a-fA-F]{24}$/)) {
            delete data._id;
        }
        if (data.quizId && !data.quizId.match(/^[0-9a-fA-F]{24}$/)) {
            delete data.quizId;
        }
        if (data.assignmentId && !data.assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
            delete data.assignmentId;
        }

        // Recurse into nested properties
        Object.keys(data).forEach(key => cleanTemporaryIds(data[key]));
      }
    };
    
    // Clean the entire content object
    cleanTemporaryIds(courseContentCopy);

    // Filter out empty items
    (courseContentCopy.modules || []).forEach((module: any) => {
      module.assignments = (module.assignments || []).filter((a: any) => a.title.trim() !== '');
      module.quizzes = (module.quizzes || []).filter((q: any) => q.title.trim() !== '');
      (module.lessons || []).forEach((lesson: any) => {
        lesson.resources = (lesson.resources || []).filter((r: any) => r.title.trim() !== '' && r.file);
        lesson.quizzes = (lesson.quizzes || []).filter((q: any) => q.title.trim() !== '');
      });
    });
    courseContentCopy.finalAssignments = (courseContentCopy.finalAssignments || []).filter((a: any) => a.title.trim() !== '');
    courseContentCopy.finalQuizzes = (courseContentCopy.finalQuizzes || []).filter((q: any) => q.title.trim() !== '');
    
    const formattedPrice = courseInfo.price === "" ? 0 : parseFloat(courseInfo.price);
    const formattedEstimatedPrice = courseInfo.estimatedPrice === "" ? 0 : parseFloat(courseInfo.estimatedPrice);

    const data = {
      ...courseInfo,
      price: formattedPrice,
      estimatedPrice: formattedEstimatedPrice,
      ...courseContentCopy,
    };

    setCourseData(data);
  };

  const handleCourseCreate = async () => {
    const data = courseData;
    if (!isLoading) {
      await createCourse(data);
    }
  };

  return (
    <div className="w-full flex min-h-screen">
      <div className="w-[80%]">
        {active === 0 && (
          <CourseInformation
            courseInfo={courseInfo}
            setCourseInfo={setCourseInfo}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 1 && (
          <CourseData
            courseContent={courseContent}
            setCourseContent={setCourseContent}
            active={active}
            setActive={setActive}
            handleSubmit={handleSubmit}
          />
        )}
        {active === 2 && (
          <CoursePreview
            active={active}
            setActive={setActive}
            courseData={courseData}
            handleCourseCreate={handleCourseCreate}
          />
        )}
      </div>
      <div className="w-[20%] mt-[100px] h-screen fixed z-[-1] top-18 right-0">
        <CourseOptions
           active={active} 
           setActive={setActive} 
        />
      </div>
    </div>
  );
};

export default CreateCourse;