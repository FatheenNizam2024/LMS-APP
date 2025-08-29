// C:\Lms-App - Copy\admin\app\components\Admin\Course\CourseInformation.tsx

import { styles } from "@/app/styles/style";
import React, { FC, useState, useEffect } from "react";

type Props = {
  courseInfo: any;
  setCourseInfo: (courseInfo: any) => void;
  active: number;
  setActive: (active: number) => void;
};

const CourseInformation: FC<Props> = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}) => {
  const [dragging, setDragging] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  useEffect(() => {
    if (typeof courseInfo.thumbnail === 'object' && courseInfo.thumbnail?.url) {
        setImagePreviewUrl(courseInfo.thumbnail.url);
    } 
    else if (typeof courseInfo.thumbnail === 'string') {
        setImagePreviewUrl(courseInfo.thumbnail);
    }
  }, [courseInfo.thumbnail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActive(active + 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setCourseInfo({ ...courseInfo, thumbnail: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCourseInfo({ ...courseInfo, thumbnail: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleThumbnailRemove = () => {
    setCourseInfo({ ...courseInfo, thumbnail: "" });
  };

  return (
    <div className="w-[80%] m-auto mt-24">
      <form onSubmit={handleSubmit} className={`${styles.label}`}>
        <div>
          <label htmlFor="name">Course Name</label>
          <input
            type="text"
            name="name"
            required
            value={courseInfo.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCourseInfo({ ...courseInfo, name: e.target.value })
            }
            id="name"
            placeholder="MERN stack LMS platform with next 13"
            className={`${styles.input}`}
          />
        </div>
        <br />
        <div className="mb-5">
          <label className={`${styles.label}`}>Course Description</label>
          <textarea
            name="description"
            id="description"
            cols={30}
            rows={8}
            placeholder="Write something amazing..."
            className={`${styles.input} !h-min !py-2`}
            value={courseInfo.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setCourseInfo({ ...courseInfo, description: e.target.value })
            }
          ></textarea>
        </div>
        <br />
        <div className="w-full flex justify-between">
            <div className="w-[45%]">
                {/* MODIFICATION: Updated label and removed 'required' */}
                <label className={`${styles.label}`}>Course Price (Optional)</label>
                <input
                    type="number"
                    name="price"
                    value={courseInfo.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setCourseInfo({ ...courseInfo, price: e.target.value })
                    }
                    id="price"
                    placeholder="Enter 0 or leave blank for free"
                    className={`${styles.input}`}
                />
            </div>
            <div className="w-[45%]">
                <label className={`${styles.label}`}>Estimated Price (Optional)</label>
                <input
                    type="number"
                    name="estimatedPrice"
                    value={courseInfo.estimatedPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setCourseInfo({ ...courseInfo, estimatedPrice: e.target.value })
                    }
                    id="estimatedPrice"
                    placeholder="59.99"
                    className={`${styles.input}`}
                />
            </div>
        </div>
        <br />
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            id="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file"
            className={`w-full min-h-[10vh] dark:border-white border-[#00000026] p-3 border flex items-center justify-center ${
              dragging ? "bg-blue-500" : "bg-transparent"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {imagePreviewUrl ? (
              <div className="w-full h-full relative">
                <img
                  src={imagePreviewUrl}
                  alt="Course Thumbnail"
                  className="max-h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                  onClick={handleThumbnailRemove}
                >
                  X
                </button>
              </div>
            ) : (
              <span className="text-black dark:text-white">
                Drag and drop your thumbnail here or click to browse
              </span>
            )}
          </label>
        </div>
        <br />
        <div className="w-full flex items-center justify-end">
          <input
            type="submit"
            value="Next"
            className="w-full 800px:w-[180px] h-[40px] bg-[#37a39a] text-center text-[#fff] rounded mt-8 cursor-pointer"
          />
        </div>
        <br />
        <br />
      </form>
    </div>
  );
};

export default CourseInformation;