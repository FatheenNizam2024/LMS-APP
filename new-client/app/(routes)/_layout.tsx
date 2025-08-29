// C:\Lms-App - Copy\client\app\(routes)\_layout.tsx
import { Stack } from "expo-router";

export default function RoutesLayout() {
  return (
    <Stack>
      <Stack.Screen name="debug/index" options={{ headerShown: true, title: "Build Info" }} />
      {/* Screens with headers */}
      <Stack.Screen name="course-details/index" options={{ headerShown: true, title: "Course Details" }} />
      <Stack.Screen name="course-access/index" options={{ headerShown: true, title: "Course Content" }} />
      <Stack.Screen name="enrolled-courses/index" options={{ headerShown: true, title: "Enrolled Courses" }} />
      <Stack.Screen name="profile-details/index" options={{ headerShown: true, title: "Profile Details" }} />
      <Stack.Screen name="courses-by-category/index" options={{ headerShown: true, title: "Category" }} />
      {/* Screens without headers */}
      <Stack.Screen name="login/index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome-intro/index" options={{ headerShown: false }} />
      <Stack.Screen name="verifyAccount/index" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password/index" options={{ headerShown: false }} />

      {/* THERE SHOULD BE NO OTHER COMPONENTS (like <View> or <Text>) HERE */}
    </Stack>
  );
}