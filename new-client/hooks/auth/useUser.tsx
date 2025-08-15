// C:\Lms-App - Copy\client\hooks\auth\useUser.tsx

import  { useEffect, useState } from "react";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- DEFINITIVE TYPE DEFINITION ---
// We define the User type directly here to ensure it's correct.
type User = {
  _id: string;
  name: string;
  email: string;
  avatar?: { url: string };
  courses: [{ _id: string }]; // The crucial 'courses' property
  // Add any other user properties you expect from the API
};

export default function useUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined); // Correctly initialize with undefined
  const [error, setError] = useState("");
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    const subscription = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      await axios
        .get(`${SERVER_URI}/me`, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        })
        .then((res: any) => {
          setUser(res.data.user);
          setLoading(false);
        })
        .catch((error: any) => {
          setError(error?.message);
          setLoading(false);
          setUser(undefined); // Clear user on error
        });
    };
    subscription();
  }, [refetch]);

  return { loading, user, error, setRefetch, refetch };
}