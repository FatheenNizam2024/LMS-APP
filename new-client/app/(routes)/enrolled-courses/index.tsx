import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { SERVER_URI } from "@/utils/uri";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { FlatList } from "react-native";

// MODIFICATION: Renamed function to start with an uppercase letter
export default function EnrolledCoursesScreen() {
  const [courses, setcourses] = useState<CoursesType[]>([]);
  // MODIFICATION: Removed unused 'loader' state. The 'loading' from useUser is sufficient.
  const { loading, user } = useUser();

  useEffect(() => {
    // Only fetch courses if the user data has been loaded
    if (user) {
      axios.get(`${SERVER_URI}/get-courses`).then((res: any) => {
        const allCourses: CoursesType[] = res.data.courses;
        // Filter courses based on the user's enrolled courses array
        const enrolledCourses = allCourses.filter((course: CoursesType) =>
          user.courses?.some((enrolledCourse: any) => enrolledCourse === course._id)
        );
        setcourses(enrolledCourses);
      });
    }
  }, [user]); // The effect now depends on the user object

  return (
    <>
      {/* MODIFICATION: Simplified loading check */}
      {loading ? (
        <Loader />
      ) : (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
          <FlatList
            data={courses}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id.toString()}
            renderItem={({ item }) => <CourseCard item={item} />}
          />
        </LinearGradient>
      )}
    </>
  );
}