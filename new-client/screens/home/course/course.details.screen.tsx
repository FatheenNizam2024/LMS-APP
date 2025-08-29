// C:\LMS App copy Part 2\Lms-App - Copy\client\screens\home\course\course.details.screen.tsx
"use client";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts, Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { Nunito_400Regular, Nunito_700Bold, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo } from "react";
import useUser from "@/hooks/auth/useUser";
import Loader from "@/components/loader/loader";
import axiosInstance from '@/utils/axios.instance';
//import { SERVER_URI } from "@/utils/uri";
//import AsyncStorage from "@react-native-async-storage/async-storage";
import useGetQuizSubmission from "@/hooks/submissions/useGetQuizSubmission";
import useGetSubmission from "@/hooks/submissions/useGetSubmission";

const QuizItem = ({ quiz, course, isEnrolled }: { quiz: IQuiz, course: CoursesType, isEnrolled: boolean }) => {
    const { submission, loading } = useGetQuizSubmission(quiz.quizId);
    const hasSubmitted = !!submission;

    const handlePress = () => {
        if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll in the course to take quizzes."); return; }
        router.push({
            pathname: "/(routes)/quiz-session",
            params: { quizData: JSON.stringify(quiz), courseId: course._id, submissionData: submission ? JSON.stringify(submission) : undefined },
        });
    };

    return (
        <TouchableOpacity style={[styles.quizContainer, hasSubmitted && styles.disabledItem, {marginLeft: 20}]} onPress={handlePress} disabled={!isEnrolled}>
            <Ionicons name={isEnrolled ? (hasSubmitted ? "checkmark-circle-outline" : "help-circle-outline") : "lock-closed-outline"} size={22} color={isEnrolled && !hasSubmitted ? "#9B59B6" : "#A9A9A9"} />
            <View style={{flex: 1, marginLeft: 10}}>
                <Text style={[styles.quizText, (!isEnrolled || hasSubmitted) && { color: '#A9A9A9' }]}>{quiz.title}</Text>
                {loading && <ActivityIndicator size="small" />}
                {hasSubmitted && <Text style={styles.scoreText}>Score: {submission.score}/{submission.totalQuestions}</Text>}
            </View>
        </TouchableOpacity>
    );
};

const AssignmentItem = ({ assignment, course, isEnrolled }: { assignment: AssignmentType, course: CoursesType, isEnrolled: boolean }) => {
    const { submission, loading } = useGetSubmission(assignment.assignmentId);
    const hasSubmitted = !!submission;

    const getStatusColor = (status: string) => {
        if (status === 'graded') return '#4CAF50'; // Green
        if (status === 'needs revision') return '#f44336'; // Red
        return '#FFC107'; // Yellow for 'submitted' or 'pending'
    };

    
    const handlePress = () => {
        if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll in the course to access assignments."); return; }
        
        // THE FIX: Navigate by passing the correct ID parameters.
        // We will use the assignment's unique ID as the "lessonId" for the purpose of this screen.
        router.push({
            pathname: "/(routes)/course-access",
            params: { lessonId: assignment.assignmentId, courseId: course._id },
        });
    };


    return (
         <TouchableOpacity style={[styles.assignmentContainer, hasSubmitted && styles.disabledItem]} onPress={handlePress} disabled={!isEnrolled}>
            <Ionicons name={isEnrolled ? (hasSubmitted ? "checkmark-circle-outline" : "document-text-outline") : "lock-closed-outline"} size={22} color={isEnrolled && !hasSubmitted ? "#c35214" : "#A9A9A9"} />
             <View style={{flex: 1, marginLeft: 10}}>
                <Text style={[styles.assignmentText, (!isEnrolled || hasSubmitted) && {color: '#A9A9A9'}]}>{assignment.title}</Text>
                {loading && <ActivityIndicator size="small" />}
                {hasSubmitted && (
                    // THE DEFINITIVE FIX: Apply the dynamic color here
                    <Text style={[styles.scoreText, { color: getStatusColor(submission.status), textTransform: 'capitalize' }]}>
                        Status: {submission.status}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const CourseCurriculum = ({ course, isEnrolled }: { course: CoursesType, isEnrolled: boolean }) => {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set());
  
  const toggleAccordion = (key: string) => {
    const newActiveState = new Set(activeModules);
    if (newActiveState.has(key)) { newActiveState.delete(key); } else { newActiveState.add(key); }
    setActiveModules(newActiveState);
  };

  const handleLessonPress = (lesson: LessonType) => {
    if (!isEnrolled) { Alert.alert("Access Denied", "Please enroll in the course to access lessons."); return; }

    // THE FIX: We now ONLY pass the essential IDs. The destination screen will handle the rest.
    router.push({
      pathname: "/(routes)/course-access",
      params: { 
          lessonId: lesson._id, 
          courseId: course._id,
      },
    });
};

 return (
    <View>
      {(course.modules || []).map((module) => {
        const moduleKey = module._id || module.moduleId;
        return (
          <View key={moduleKey} style={styles.moduleContainer}>
            <TouchableOpacity style={styles.moduleHeader} onPress={() => toggleAccordion(moduleKey)}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              <Ionicons name={activeModules.has(moduleKey) ? "chevron-up-outline" : "chevron-down-outline"} size={24} color="#333" />
            </TouchableOpacity>
            {activeModules.has(moduleKey) && (
              <View style={styles.lessonsWrapper}>
                {(module.lessons || []).map((lesson) => (
                    <View key={lesson._id}>
                        <TouchableOpacity style={styles.lessonContainer} onPress={() => handleLessonPress(lesson)} disabled={!isEnrolled}>
                            <Ionicons name={isEnrolled ? "play-circle-outline" : "lock-closed-outline"} size={22} color={isEnrolled ? "#2467EC" : "#A9A9A9"} />
                            <Text style={[styles.lessonTitle, !isEnrolled && { color: '#A9A9A9' }]}>{lesson.title}</Text>
                        </TouchableOpacity>
                        {(lesson.quizzes || []).map((quiz) => <QuizItem key={quiz.quizId} quiz={quiz} course={course} isEnrolled={isEnrolled} />)}
                    </View>
                ))}
                {(module.assignments || []).map((assignment) => <AssignmentItem key={assignment.assignmentId} assignment={assignment} course={course} isEnrolled={isEnrolled} />)}
                {(module.quizzes || []).map((quiz) => <QuizItem key={quiz.quizId} quiz={quiz} course={course} isEnrolled={isEnrolled} />)}
              </View>
            )}
          </View>
        );
      })}
      {(course.finalAssignments || []).length > 0 && (
        <View style={styles.moduleContainer}>
            <Text style={styles.finalHeaderText}>Final Assignments</Text>
            {(course.finalAssignments || []).map((assignment) => <AssignmentItem key={assignment.assignmentId} assignment={assignment} course={course} isEnrolled={isEnrolled} />)}
        </View>
      )}
      {(course.finalQuizzes || []).length > 0 && (
        <View style={styles.moduleContainer}>
            <Text style={styles.finalHeaderText}>Final Quizzes</Text>
            {(course.finalQuizzes || []).map((quiz) => <QuizItem key={quiz.quizId} quiz={quiz} course={course} isEnrolled={isEnrolled} />)}
        </View>
      )}
    </View>
  );
};

export default function CourseDetailScreen() {
  const { user, loading: userLoading } = useUser();
  const { item } = useLocalSearchParams();
  
  const initialCourseData: CoursesType | null = item ? JSON.parse(item as string) : null;

  const [courseData, setCourseData] = useState<CoursesType | null>(item ? JSON.parse(item as string) : null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const isEnrolled = useMemo(() => {
      if (!user || !user.courses || !initialCourseData) return false;
      return user.courses.some((c: { _id: string }) => c._id === initialCourseData._id);
  }, [user, initialCourseData]);

  useEffect(() => {
    // If the user is not enrolled, we don't need to fetch full content. We can stop loading.
    if (!isEnrolled) {
      setIsLoadingContent(false);
      return;
    }

    // If the user IS enrolled, fetch the detailed content.
    const fetchFullCourseContent = async () => {
      if (!initialCourseData?._id) {
        setIsLoadingContent(false);
        return;
      }
      
      try {
        // We are already loading, no need to set it again.
        const res = await axiosInstance.get(`/get-course-content/${initialCourseData._id}`);
        // Update our course data with the detailed modules from the server.
        setCourseData(prevData => ({ ...prevData!, modules: res.data.content }));
      } catch (error) { 
        console.error("Failed to fetch full course content:", error);
        // On error, we just stick with the initial data.
      } finally {
        // This is the crucial part: ALWAYS set loading to false when done.
        setIsLoadingContent(false);
      }
    };
    
    fetchFullCourseContent();
    
  }, [isEnrolled, initialCourseData]); // Dependency array is now simpler.

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold, Raleway_700Bold, Nunito_400Regular, Nunito_700Bold, Nunito_600SemiBold
  });

  if (userLoading || isLoadingContent || !fontsLoaded || fontError || !courseData) {
    return <Loader />;
  }

  // If after all loading, we still have no course data, show an error.
  if (!courseData) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Course data could not be loaded.</Text>
          </View>
      )
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={{ flex: 1, paddingTop: 15 }}>
      <ScrollView>
        <View style={{ marginHorizontal: 16 }}>
          <Image source={{ uri: courseData.thumbnail.url! }} style={{ width: "100%", height: 230, borderRadius: 6 }} />
        </View>
        <Text style={styles.courseName}>{courseData.name}</Text>
        <View style={{ padding: 10 }}>
          <Text style={styles.heading}>Description</Text>
          <Text style={styles.descriptionText}>{courseData.description}</Text>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={styles.heading}>Course Curriculum</Text>
          <CourseCurriculum course={courseData} isEnrolled={isEnrolled} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    courseName: { marginHorizontal: 16, marginTop: 15, fontSize: 24, fontFamily: "Raleway_700Bold" },
    heading: { fontSize: 20, fontFamily: "Raleway_700Bold", marginBottom: 10, },
    descriptionText: { fontSize: 16, color: '#525258', fontFamily: "Nunito_400Regular", lineHeight: 24, },
    moduleContainer: { marginBottom: 15, backgroundColor: '#fff', borderRadius: 8, elevation: 2, overflow: 'hidden' },
    moduleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    moduleTitle: { fontSize: 20, fontFamily: "Raleway_700Bold", flex: 1 },
    lessonsWrapper: { borderTopWidth: 1, borderTopColor: '#eee' },
    lessonContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, },
    lessonTitle: { fontSize: 16, fontFamily: "Nunito_600SemiBold", color: '#555', marginLeft: 10, flexShrink: 1, },
    assignmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    assignmentText: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: '#c35214',
        marginLeft: 10,
        flexShrink: 1,
    },
    quizContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    quizText: {
        fontSize: 16,
        fontFamily: "Nunito_700Bold",
        color: '#9B59B6',
        marginLeft: 10,
        flexShrink: 1,
    },
    disabledItem: {
        backgroundColor: '#f0f0f0',
    },
    scoreText: {
        fontSize: 12,
        //color: 'green',
        fontFamily: 'Nunito_600SemiBold',
        marginTop: 2,
    },
    finalHeaderText: {
        padding: 15,
        fontSize: 18,
        fontFamily: "Raleway_700Bold",
        backgroundColor: '#f5f5f5'
    }
});