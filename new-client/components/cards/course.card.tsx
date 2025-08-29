// C:\LMS App copy Part 2\Lms-App - Copy\client\components\cards\course.card.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
//import Ratings from "@/utils/ratings";
import useUser from "@/hooks/auth/useUser"; // MODIFICATION: Import the useUser hook

export default function CourseCard({ item }: { item: CoursesType }) {
  // MODIFICATION: Get the current user and their loading state
  const { user, loading } = useUser();

  const totalLectures = item.modules?.reduce((total, module) => 
    total + (module.lessons?.length || 0), 0) || 0;

  // MODIFICATION: Check if the user is enrolled in this specific course
  const isEnrolled = user?.courses?.some((enrolledCourse: any) => enrolledCourse._id === item._id);

  const handlePress = () => {
    // If user data is still loading, do nothing
    if (loading) {
      return;
    }

    // If the user is enrolled, navigate to the course details screen
    if (isEnrolled) {
      router.push({
        pathname: "/(routes)/course-details",
        params: { item: JSON.stringify(item) },
      });
    } else {
      // If the user is not enrolled, show an alert message
      Alert.alert(
        "Access Denied",
        "You are not enrolled in this course. Please contact the admin for access."
      );
    }
  };

  return (
    // MODIFICATION: The entire card now uses the new handlePress function
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
    >
      <View style={{ paddingHorizontal: 10 }}>
        <Image
          style={{
            width: wp(86),
            height: 220,
            borderRadius: 5,
            alignSelf: "center",
            resizeMode: "cover",
          }}
          source={{ uri: item?.thumbnail?.url! }}
        />
        {/* MODIFICATION: Added an overlay for locked courses */}
        {!isEnrolled && !loading && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed-outline" size={50} color="#fff" />
          </View>
        )}
        <View style={{ width: wp(85), marginTop: 10 }}>
          <Text
            style={{
              fontSize: 16,
              textAlign: "left",
              fontFamily: "Raleway_600SemiBold",
            }}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 5,
          }}
        >
          {/* <Ratings rating={item.ratings || 0} /> */}
          <Text style={{ fontFamily: "Nunito_400Regular" }}>{item.purchased || 0} Students</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 5,
            marginTop: 10,
          }}
        >
          {/* <Text style={{ fontSize: 18, fontWeight: "bold" }}>
             {item.price === 0 ? "Enrolled" : `$${item.price}`}
          </Text> */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="list-outline" size={20} color={"#8A8A8A"} />
            <Text style={{ marginLeft: 5 }}>
              {totalLectures} Lectures 
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 6,
    borderRadius: 12,
    width: "95%",
    height: "auto",
    overflow: "hidden",
    margin: "auto",
    marginVertical: 15,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  // MODIFICATION: Added styles for the lock icon overlay
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5, // Match the image's border radius
    marginHorizontal: 10, // Match the image's container padding
  },
});