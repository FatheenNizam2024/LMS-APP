import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER_URI } from '@/utils/uri';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useGetSubmission(assignmentId: string) {
  const [submission, setSubmission] = useState<ISubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!assignmentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      try {
        const res = await axios.get(`${SERVER_URI}/user-submission/${assignmentId}`, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        });
        setSubmission(res.data.submission);
      } catch (error) {
        console.error("Failed to fetch submission:", error);
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [assignmentId, refetch]);

  return { submission, loading, doRefetch: () => setRefetch(!refetch) };
}