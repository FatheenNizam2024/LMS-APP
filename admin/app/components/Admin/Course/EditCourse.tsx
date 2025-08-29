// C:\Lms-App - Copy\admin\app\components\Admin\Course\EditCourse.tsx

"use client";
import React, { FC, useEffect, useState } from "react";
import CourseInformation from "./CourseInformation";
import CourseOptions from "./CourseOptions";
import CourseData from "./CourseData";
import CoursePreview from "./CoursePreview";
import {
  useEditCourseMutation,
  useGetAllCoursesQuery,
} from "../../../../redux/features/courses/coursesApi";
import { toast } from "react-hot-toast";
import { redirect } from "next/navigation";
import Loader from "../../Loader/Loader";

type Props = {
  id: string;
};

const EditCourse: FC<Props> = ({ id }) => {
  const [editCourse, { isSuccess, error }] = useEditCourseMutation();
  const { data, isLoading: isCourseLoading } = useGetAllCoursesQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  const [active, setActive] = useState(0);
  
  const [courseInfo, setCourseInfo] = useState({
    name: "",
    description: "",
    price: "",
    estimatedPrice: "",
    thumbnail: "" as any,
  });

  const [courseContent, setCourseContent] = useState<any>(null);
  const [courseData, setCourseData] = useState({});

  useEffect(() => {
    const editCourseData = data && data.courses.find((i: any) => i._id === id);
    if (editCourseData) {
      setCourseInfo({
        name: editCourseData.name,
        description: editCourseData.description,
        price: editCourseData.price,
        estimatedPrice: editCourseData.estimatedPrice,
        thumbnail: editCourseData.thumbnail,
      });
      setCourseContent({
        modules: (editCourseData.modules || []).map((module: any) => ({
          ...module,
          assignments: module.assignments || [],
          quizzes: module.quizzes || [],
          lessons: (module.lessons || []).map((lesson: any) => ({
            ...lesson,
            resources: (lesson.resources || []).map((res: any) => ({
              title: res.title,
              file: res.file || "", 
            })),
            quizzes: lesson.quizzes || [],
          })),
        })),
        finalAssignments: editCourseData.finalAssignments || [],
        finalQuizzes: editCourseData.finalQuizzes || [],
      });
    }
  }, [data, id]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Course Updated successfully");
      redirect("/admin/courses");
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [isSuccess, error]);

   const handleSubmit = async () => {
    const courseContentCopy = JSON.parse(JSON.stringify(courseContent));

    // MODIFICATION: Robust recursive function to remove temporary frontend IDs
    const cleanTemporaryIds = (data: any) => {
        if (Array.isArray(data)) {
            data.forEach(cleanTemporaryIds);
        } else if (data && typeof data === 'object') {
            // Check for our temporary, numeric string IDs and delete them
            // The regex check ensures we don't delete real ObjectIds from the DB
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

    cleanTemporaryIds(courseContentCopy);

    (courseContentCopy.modules || []).forEach((module: any) => {
      module.assignments = (module.assignments || []).filter((a:any) => a.title.trim() !== '');
      module.quizzes = (module.quizzes || []).filter((q: any) => q.title.trim() !== '');
      (module.lessons || []).forEach((lesson: any) => {
        lesson.resources = (lesson.resources || []).filter((r: any) => r.title.trim() !== '' && r.file);
        lesson.quizzes = (lesson.quizzes || []).filter((q: any) => q.title.trim() !== '');
      });
    });
    courseContentCopy.finalAssignments = (courseContentCopy.finalAssignments || []).filter((a:any) => a.title.trim() !== '');
    courseContentCopy.finalQuizzes = (courseContentCopy.finalQuizzes || []).filter((q: any) => q.title.trim() !== '');
    
    const formattedPrice = courseInfo.price === "" ? 0 : parseFloat(courseInfo.price);
    const formattedEstimatedPrice = courseInfo.estimatedPrice === "" ? 0 : parseFloat(courseInfo.estimatedPrice);

    const dataToSubmit: any = {
        ...courseInfo,
        price: formattedPrice,
        estimatedPrice: formattedEstimatedPrice,
        ...courseContentCopy
    };

    if (typeof dataToSubmit.thumbnail === 'object' && dataToSubmit.thumbnail !== null) {
        delete dataToSubmit.thumbnail;
    }
    
    setCourseData(dataToSubmit);
  };

  const handleCourseCreate = async () => {
    const data = courseData;
    if (Object.keys(data).length > 0) {
        await editCourse({ id, data }); 
    }
  };
  
  return (
    <>
      {isCourseLoading || !courseContent ? <Loader /> : (
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
                isEdit={true}
              />
            )}
          </div>
          <div className="w-[20%] mt-[100px] h-screen fixed z-[-1] top-18 right-0">
            <CourseOptions active={active} setActive={setActive} />
          </div>
        </div>
      )}
    </>
  );
};

export default EditCourse;