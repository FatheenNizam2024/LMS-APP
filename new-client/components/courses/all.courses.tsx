// C:\Lms-App - Copy\client\components\courses\all.courses.tsx

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFonts, Raleway_700Bold, Raleway_600SemiBold } from "@expo-google-fonts/raleway";
import { Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { router } from "expo-router";
import CourseCard from "@/components/cards/course.card";

type Props = {
  courses: CoursesType[];
};

export default function AllCourses({ courses }: Props) {
  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_600SemiBold,
    Raleway_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  // Safety check. If courses is not an array, render nothing.
  if (!Array.isArray(courses)) {
      return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Popular courses</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      
      {/* 
        This component no longer has a FlatList. It just renders the cards.
        The parent component's FlatList will handle the virtualization.
      */}
      <View>
        {courses.map((item) => (
          <CourseCard item={item} key={item._id} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        marginHorizontal: 16, 
        marginTop: 20
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: {
        fontSize: 20,
        color: "#000000",
        fontFamily: "Raleway_700Bold",
    },
    seeAllText: {
        fontSize: 15,
        color: "#2467EC",
        fontFamily: "Nunito_600SemiBold",
    }
});