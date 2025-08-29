// C:\LMS App copy Part 2\Lms-App - Copy\new-client\hooks\auth\useUser.tsx

import { useState, useEffect, useCallback } from "react";
// import axios from "axios";
import axiosInstance from '@/utils/axios.instance';
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);
  
  const fetchUser = useCallback(async () => {
    setLoading(true);
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!accessToken) {
      setUser(undefined);
      setLoading(false);
      return;
    }

    try {
      // NOTE: This endpoint MUST exist on the server for students
      const res = await axiosInstance.get(`${SERVER_URI}/me-student`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
      setUser(res.data.user);
    } catch (error: any) {
      console.log("useUser hook error:", error.response?.data?.message || error.message);
      // If fetching fails (e.g., token expired), clear the user
      setUser(undefined); 
      // We could also try to refresh the token here in a more advanced setup
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { loading, user, refetch: fetchUser };
}