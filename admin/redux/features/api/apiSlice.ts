// C:\LMS App copy Part 2\Lms-App - Copy\admin\redux\features\api\apiSlice.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn } from "../auth/authSlice";
import Cookies from "js-cookie";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URI,
    prepareHeaders: (headers) => {
      const accessToken = Cookies.get("accessToken");
      const refreshToken = Cookies.get("refreshToken");

      if (accessToken) {
        headers.set("access-token", accessToken);
      }
      if (refreshToken) {
        headers.set("refresh-token", refreshToken);
      }    
      return headers;
    },
  }),

  // THE DEFINITIVE FIX: Register all custom tags here
  tagTypes: ["Users", "Courses", "Orders", "AssignmentSubmissions", "QuizSubmissions", "Students"],
  
  endpoints: (builder) => ({
    refreshToken: builder.query({
      query: () => ({ // Corrected: data parameter not needed
        url: "refresh",
        method: "GET",
        credentials: "include" as const,
      }),
    }),
    loadUser: builder.query({
      query: () => ({ // Corrected: data parameter not needed
        url: "me",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              user: result.data.user,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
  }),
});

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;