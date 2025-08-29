// C:\Lms-App - Copy\client\screens\courses\courses.screen.tsx

import { SERVER_URI } from "@/utils/uri";
import axios from "axios";
import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import Loader from "@/components/loader/loader";
import { LinearGradient } from "expo-linear-gradient";
import CourseCard from "@/components/cards/course.card";

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We only need to fetch the courses now
    axios
      .get(`${SERVER_URI}/get-courses`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then((res: any) => {
        setCourses(res.data.courses);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        console.log(error);
      });
  }, []);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <LinearGradient
          colors={["#E5ECF9", "#F6F7F9"]}
          style={{ flex: 1, paddingTop: 65 }}
        >
            {/* The category filter ScrollView has been removed */}
            <Text style={{textAlign: 'center', fontSize: 22, fontFamily: 'Raleway_700Bold', padding: 15}}>All Courses</Text>
          <View>
            <ScrollView style={{ marginHorizontal: 15, gap: 12 }}>
              {courses?.map((item: CoursesType, index: number) => (
                <CourseCard item={item} key={index} />
              ))}
            </ScrollView>
            {courses?.length === 0 && (
              <Text
                style={{ textAlign: "center", paddingTop: 50, fontSize: 18 }}
              >
                No courses available!
              </Text>
            )}
          </View>
        </LinearGradient>
      )}
    </>
  );
}