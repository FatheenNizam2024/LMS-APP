// C:\LMS App copy Part 2\Lms-App - Copy\new-client\app\(routes)\enrolled-courses\index.tsx

import { useEffect, useState } from "react";
import CourseCard from "@/components/cards/course.card";
import Loader from "@/components/loader/loader";
import useUser from "@/hooks/auth/useUser";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, View, Text } from "react-native";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";

export default function EnrolledCoursesScreen() {
  const { loading: userLoading, user } = useUser();
  const [fullCourses, setFullCourses] = useState<CoursesType[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    // This function will run when the user data is available.
    const fetchFullCourseDetails = async () => {
      // Ensure we have a user with a courses array that is not empty.
      if (user && user.courses && user.courses.length > 0) {
        try {
          setLoadingCourses(true);
          
          // Create an array of promises, where each promise fetches one full course.
          const courseDetailPromises = user.courses.map(enrolledCourse =>
            axios.get(`${SERVER_URI}/get-course/${enrolledCourse._id}`)
          );
          
          // Wait for all the API calls to complete.
          const responses = await Promise.all(courseDetailPromises);
          
          // Extract the .data.course object from each response.
          const fetchedCourses = responses.map(res => res.data.course);
          
          setFullCourses(fetchedCourses);

        } catch (error) {
          console.error("Failed to fetch full details for enrolled courses:", error);
          setFullCourses([]); // Clear courses on error
        } finally {
          setLoadingCourses(false);
        }
      } else {
        // If the user has no courses, we can stop loading.
        setLoadingCourses(false);
      }
    };

    // Only run the fetch function if the initial user loading is complete.
    if (!userLoading) {
      fetchFullCourseDetails();
    }
  }, [user, userLoading]); // Rerun this effect if the user object changes.

  const isLoading = userLoading || loadingCourses;

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
          <FlatList
            // Use the new state variable that holds the full course objects.
            data={fullCourses}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id.toString()}
            // The 'item' passed to CourseCard now has the full CoursesType structure.
            renderItem={({ item }) => <CourseCard item={item} />}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 18, color: '#666' }}>You are not enrolled in any courses yet.</Text>
              </View>
            }
          />
        </LinearGradient>
      )}
    </>
  );
}