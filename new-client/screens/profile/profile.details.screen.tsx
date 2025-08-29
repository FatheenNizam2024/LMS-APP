// C:\LMS App copy Part 2\Lms-App - Copy\new-client\screens\profile\profile.details.screen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_600SemiBold, Nunito_400Regular } from "@expo-google-fonts/nunito";

export default function ProfileDetailScreen() {
  const { user: userString } = useLocalSearchParams();
  const user: User | null = userString ? JSON.parse(userString as string) : null;

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  if (!user) {
    return (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
            <Text style={styles.errorText}>Could not load user data.</Text>
        </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>{user.name}</Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{user.username}</Text>
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email Address</Text>
                <Text style={styles.value}>{user.email}</Text>
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.coursesHeader}>Enrolled Courses</Text>
            {user.courses && user.courses.length > 0 ? (
                user.courses.map((course) => (
                    <Text key={course._id} style={styles.courseItem}>• {course.name}</Text>
                ))
            ) : (
                <Text style={styles.noCoursesText}>You are not enrolled in any courses yet.</Text>
            )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#888',
        fontFamily: 'Nunito_600SemiBold',
        marginBottom: 4,
    },
    value: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'Nunito_400Regular',
    },
    coursesHeader: {
        fontSize: 20,
        fontFamily: 'Raleway_700Bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    courseItem: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: '#555',
        paddingVertical: 5,
    },
    noCoursesText: {
        fontSize: 16,
        fontFamily: 'Nunito_400Regular',
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
});