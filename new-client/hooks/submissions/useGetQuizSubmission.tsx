// C:\LMS App copy Part 2\Lms-App - Copy\new-client\hooks\submissions\useGetQuizSubmission.tsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER_URI } from '@/utils/uri';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the submission type locally for the hook
type IQuizSubmission = {
    _id: string;
    score: number;
    totalQuestions: number;
    // Add other fields you might need
};

export default function useGetQuizSubmission(quizId: string) {
  const [submission, setSubmission] = useState<IQuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!quizId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      try {
        const res = await axios.get(`${SERVER_URI}/user-quiz-submission/${quizId}`, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        });
        setSubmission(res.data.submission);
      } catch (error) {
        console.error("Failed to fetch quiz submission:", error);
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [quizId, refetch]);

  return { submission, loading, doRefetch: () => setRefetch(!refetch) };
}