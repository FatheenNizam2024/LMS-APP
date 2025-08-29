// C:\LMS App copy Part 2\Lms-App - Copy\new-client\app\(routes)\courses-by-category\index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { SERVER_URI } from '@/utils/uri';
import CourseCard from '@/components/cards/course.card';
import Loader from '@/components/loader/loader';

export default function CoursesByCategoryScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId: string, categoryName: string }>();
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!categoryId) return;
      try {
        setLoading(true);
        // We'll need a new server endpoint for this, but for now, we'll filter on the client.
        // In a future step, we can optimize this on the server.
        const res = await axios.get(`${SERVER_URI}/get-courses`);
        const allCourses: CoursesType[] = res.data.courses;
        
        // This is a placeholder filter. We need to add categories to the course model.
        // For now, let's assume this works if the data is available.
        // const filtered = allCourses.filter(c => c.categoryId === categoryId);
        // For now, just show all courses as a placeholder.
        setCourses(allCourses);

      } catch (error) {
        console.error("Failed to fetch courses by category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [categoryId]);

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: categoryName || 'Courses' }} />
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => <CourseCard item={item} />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
              <Text style={{ fontSize: 18, color: '#666' }}>No courses found in this category.</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}