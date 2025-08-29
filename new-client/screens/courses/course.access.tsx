// C:\LMS App copy Part 2\Lms-App - Copy\client\screens\courses\course.access.tsx

import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, TextInput, RefreshControl, Alert
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo} from "react";
import { useFocusEffect } from "expo-router";
import { router,  useLocalSearchParams } from "expo-router";
//import { WebView } from "react-native-webview";
import { Toast } from "react-native-toast-notifications";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from '@/utils/axios.instance';
import { SERVER_URI } from "@/utils/uri";
import useGetSubmission from "@/hooks/submissions/useGetSubmission";
import Loader from "@/components/loader/loader";
import * as ScreenCapture from 'expo-screen-capture';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
// THE FIX: Import the new custom player and the useUser hook
import CustomVideoPlayer from '@/components/common/CustomVideoPlayer';
import useUser from '@/hooks/auth/useUser';

const useScreenCaptureProtection = () => {
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen comes into view
      const activateProtection = async () => {
        await ScreenCapture.preventScreenCaptureAsync();
      };

      activateProtection();

      // This is the cleanup function that runs when the user navigates away
      return () => {
        ScreenCapture.allowScreenCaptureAsync();
      };
    }, [])
  );

  useEffect(() => {
    // This adds a listener specifically for screenshots on iOS
    const subscription = ScreenCapture.addScreenshotListener(() => {
      Alert.alert("Screenshot Taken!", "Taking screenshots of course material is not permitted.");
      // Here you could also add an API call to log this event on your server
    });

    return () => subscription.remove();
  }, []);
};


export default function CourseAccessScreen() {
  useScreenCaptureProtection();
  const { user } = useUser();
  const { lessonId, courseId } = useLocalSearchParams<{ lessonId: string, courseId: string }>();
  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [course, setCourse] = useState<CoursesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  
  const assignment = lesson?.assignment;
  
  // MODIFICATION: Use the new custom hook to get submission status
  const { submission, loading: submissionLoading, doRefetch } = useGetSubmission(assignment?.assignmentId!);

  // THE FIX: This useEffect now fetches the entire, up-to-date course content
  useEffect(() => {
    const fetchLatestContent = async () => {
      if (!courseId || !lessonId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/get-course-content/${courseId}`);
        const allModules: ModuleType[] = res.data.content;
        
        let foundLesson: LessonType | null = null;
        let foundCourse: CoursesType | null = null; // We'll need the course for other things

        // Find the specific lesson within the fetched modules
        for (const module of allModules) {
          let l = module.lessons.find(l => l._id === lessonId);
          if (l) {
            foundLesson = l;
            break;
          }
          let a = module.assignments?.find(a => a.assignmentId === lessonId);
          if (a) {
            foundLesson = {
                _id: a.assignmentId,
                title: a.title,
                assignment: a,
                resources: [], // Assignments don't have resources directly
                quizzes: [],
            };
            break;
          }
        }
        
        // We also need the top-level course data
        const courseRes = await axiosInstance.get(`/get-course/${courseId}`);
        setCourse(courseRes.data.course);
        setLesson(foundLesson);

      } catch (error) {
        console.error("Failed to fetch latest lesson content:", error);
        Toast.show("Error loading lesson.", { type: "danger" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLatestContent();
  }, [courseId, lessonId]); // It runs when the IDs change


// This useEffect fetches the video URL *after* the lesson data has been loaded
  useEffect(() => {
    const fetchVideoUrl = async () => {
      if (lesson && course && lesson.video?.objectName) {
        try {
          setUrlLoading(true);
          const response = await axiosInstance.get(`/get-presigned-video-url/${course._id}/${lesson._id}`);
          if (response.data && response.data.url) {
            setHlsUrl(response.data.url);
          }
        } catch (error) {
          console.error("Failed to fetch secure video URL:", error);
        } finally {
          setUrlLoading(false);
        }
      } else {
        setUrlLoading(false);
      }
    };
    fetchVideoUrl();
  }, [lesson, course]); // It runs when the lesson or course state updates

  
  // THE DEFINITIVE FIX: Calculate prev and next lesson IDs here, based on the current state.
  const { prevLessonId, nextLessonId } = useMemo(() => {
      if (!course || !lesson) {
          return { prevLessonId: null, nextLessonId: null };
      }

      const allLessons: LessonType[] = [];
      course.modules.forEach(module => {
          allLessons.push(...module.lessons);
      });

      const currentIndex = allLessons.findIndex(l => l._id === lesson._id);

      if (currentIndex === -1) {
          return { prevLessonId: null, nextLessonId: null };
      }

      const prev = currentIndex > 0 ? allLessons[currentIndex - 1]._id : null;
      const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1]._id : null;
      
      return { prevLessonId: prev, nextLessonId: next };

  }, [course, lesson]); // This calculation re-runs whenever the course or lesson changes.


  const handleNavigate = (targetLessonId: string | null) => {
      if (!targetLessonId) return;
      
      // We use 'replace' to have a clean navigation history.
      router.replace({
          pathname: "/(routes)/course-access",
          params: { lessonId: targetLessonId, courseId: courseId }
      });
  };
  
  const handleDownload = async (resource: any) => {
      if (!course || !lesson) return;
      const currentModule = course.modules.find(m => m.lessons.some(l => l._id === lesson._id));
      if (!currentModule) {
          Toast.show("Could not find module for this resource.", { type: "danger" });
          return;
      }
      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) {
            Toast.show("Please log in to download resources.", { type: "warning" });
            return;
        }
        const downloadUrl = `${SERVER_URI}/resource/${course._id}/${currentModule._id}/${lesson._id}/${resource._id}?token=${refreshToken}`;
        await Linking.openURL(downloadUrl);
      } catch (error) {
        console.error("Failed to open URL:", error);
        Toast.show("Could not open the download link.", { type: "danger" });
      }
    };
  
  const handleAssignmentSubmit = async () => {
    if (!assignment) return;
    if (submissionLink.trim() === "") {
        Toast.show("Please enter a link for your submission.", { type: "warning" });
        return;
    }
    setIsSubmitting(true);
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    
    const submissionData = {
        courseId: course?._id,
        assignmentId: assignment.assignmentId,
        content: { format: "link", url: submissionLink }
    };
    
    await axiosInstance.post(`${SERVER_URI}/submit-assignment`, submissionData, {
        headers: { "access-token": accessToken, "refresh-token": refreshToken },
    }).then(res => {
        Toast.show("Assignment submitted successfully!", { type: "success" });
        setSubmissionLink("");
        doRefetch(); // Refetch submission status
    }).catch(error => {
        const message = error.response?.data?.message || "An error occurred";
        Toast.show(message, { type: "danger" });
    }).finally(() => {
        setIsSubmitting(false);
    });
  };
  
   if (isLoading) {
    return <Loader />;
  }

  if (!lesson || !course) {
    return <View style={styles.container}><Text>Could not load lesson content.</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={submissionLoading} onRefresh={doRefetch} />}
    >
      {urlLoading ? (
        <View style={styles.videoPlaceholder}>
            <ActivityIndicator size="large" color="#888" />
        </View>
      ) : hlsUrl && user?.username ? (
        <CustomVideoPlayer hlsUrl={hlsUrl} username={user.username} />
      ) : (
        <View style={styles.noVideoContainer}>
            <FontAwesome name="file-text-o" size={50} color="#ccc" />
            <Text style={styles.noVideoText}>Lesson Overview</Text>
        </View>
      )}

        <View style={styles.navButtonContainer}>
                <TouchableOpacity
                    style={[styles.navButton, !prevLessonId && styles.disabledButton]}
                    disabled={!prevLessonId}
                    onPress={() => handleNavigate(prevLessonId!)}
                >
                    <Ionicons name="chevron-back" size={24} color="white" />
                    <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, !nextLessonId && styles.disabledButton]}
                    disabled={!nextLessonId}
                    onPress={() => handleNavigate(nextLessonId!)}
                >
                    <Text style={styles.navButtonText}>Next</Text>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </TouchableOpacity>
            </View>

      <Text style={styles.lessonTitle}>{lesson.title}</Text>
      
      {(lesson?.resources || []).length > 0 && (
          <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resources</Text>
              {(lesson?.resources || []).map((res, index) => (
                  <TouchableOpacity key={index} style={styles.resourceItem} onPress={() => handleDownload(res)}>
                      <FontAwesome name="file-pdf-o" size={20} color="#2467EC" />
                      <Text style={styles.resourceTitle}>{res.title}</Text>
                  </TouchableOpacity>
              ))}
          </View>
      )}
      
      {assignment && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment</Text>
            <Text style={styles.assignmentTitle}>{assignment.title}</Text>
            <Text style={styles.assignmentDescription}>{assignment.description}</Text>
            
            {isLoading ? <Loader /> : (
                <>
                    {/* MODIFICATION: Conditional UI based on submission status */}
                    <TextInput 
                        style={[styles.submissionInput, submission && styles.disabledInput]}
                        placeholder="https://github.com/your-repo/your-submission"
                        value={submissionLink}
                        onChangeText={setSubmissionLink}
                        editable={!submission} // Disable if submission exists
                    />
                    <TouchableOpacity 
                        style={[styles.button, (isSubmitting || submission) && styles.disabledButton]} 
                        disabled={isSubmitting || !!submission} 
                        onPress={handleAssignmentSubmit}
                    >
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{submission ? 'Submitted' : 'Submit Assignment'}</Text>}
                    </TouchableOpacity>

                    {/* MODIFICATION: Display submission status and feedback */}
                    {submission && (
                        <View style={styles.resultsContainer}>
                            <Text style={styles.resultsTitle}>Your Submission Status</Text>
                            <Text style={styles.statusText}>
                                Status: <Text style={{
                                    color: submission.status === 'graded' ? '#4CAF50' : 
                                           submission.status === 'needs revision' ? '#f44336' : '#FFC107',
                                    fontWeight: 'bold'
                                }}>{submission.status}</Text>
                            </Text>
                            {submission.grade && <Text style={styles.statusText}>Grade: {submission.grade}</Text>}
                            {submission.feedback && <Text style={styles.statusText}>Feedback: {submission.feedback}</Text>}
                        </View>
                    )}
                </>
            )}
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F7F9' },
    videoPlaceholder: { 
        width: "100%", 
        aspectRatio: 16 / 9, 
        backgroundColor: '#e0e0e0', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    // THE FIX: Add new styles for the navigation buttons
    navButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginTop: 10,
    },
    navButton: {
        flexDirection: 'row',
        backgroundColor: '#2467EC',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginHorizontal: 5,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
    //videoPlaceholder: { width: "100%", aspectRatio: 16 / 9, borderRadius: 10, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    videoContainer: { width: "100%", aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
    noVideoContainer: { width: "100%", aspectRatio: 16 / 9, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    noVideoText: { marginTop: 10, color: '#ccc', fontSize: 18 },
    lessonTitle: { fontSize: 22, fontWeight: "bold", paddingVertical: 15, fontFamily: 'Raleway_700Bold' },
    section: { marginTop: 10, padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 20, fontFamily: 'Raleway_600SemiBold', marginBottom: 10 },
    resourceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    resourceTitle: { marginLeft: 10, fontSize: 16, color: '#2467EC', fontFamily: 'Nunito_400Regular' },
    assignmentTitle: { fontSize: 18, fontFamily: 'Nunito_700Bold', marginBottom: 5 },
    assignmentDescription: { fontSize: 16, color: '#555', marginBottom: 15, fontFamily: 'Nunito_400Regular' },
    button: { height: 45, backgroundColor: "#2467EC", borderRadius: 8, alignItems: "center", justifyContent: "center" },
    //disabledButton: { backgroundColor: '#A9A9A9' },
    buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
    submissionInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 15 },
    disabledInput: { backgroundColor: '#f0f0f0', color: '#888' },
    // MODIFICATION: Styles for results display
    resultsContainer: { marginTop: 20, padding: 15, backgroundColor: '#E5ECF9', borderRadius: 8 },
    resultsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    statusText: { fontSize: 16, marginVertical: 4, textTransform: 'capitalize' }
});