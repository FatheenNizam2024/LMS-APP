import { apiSlice } from "../api/apiSlice";
import { userLoggedIn, userLoggedOut, userRegistration } from "./authSlice";
import Cookies from "js-cookie";

type RegistrationResponse = {
  message: string;
  activationToken: string;
};

type RegistrationData = {};

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // This is for the admin sign up, it is correct.
    register: builder.mutation({
      query: (data) => ({
        url: "registration",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userRegistration({
              token: result.data.activationToken,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
    
    // This is for admin account activation, it is correct.
    activation: builder.mutation({
      query: ({ activation_token, activation_code }) => ({
        url: "activate-user",
        method: "POST",
        body: {
          activation_token,
          activation_code,
        },
      }),
    }),

    // MODIFICATION: Login mutation now uses username and does not log in directly
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "admin-login",
        method: "POST",
        body: {
          email,
          password,
        },
        //credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          Cookies.set("accessToken", result.data.accessToken);
          Cookies.set("refreshToken", result.data.refreshToken);
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              refreshToken: result.data.refreshToken,
              user: result.data.user,
            })
          );
        } catch (error: any) { console.log(error); }
      },
    }),

    // MODIFICATION: Added a new mutation to verify the OTP and complete login
    verifyOtp: builder.mutation({
        query: ({ userId, otp }) => ({
            url: "verify-otp",
            method: "POST",
            body: { userId, otp },
            credentials: "include" as const,
        }),
        async onQueryStarted(arg, { queryFulfilled, dispatch }) {
            try {
              const result = await queryFulfilled;
              Cookies.set("accessToken", result.data.accessToken);
              Cookies.set("refreshToken", result.data.refreshToken);
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
    socialAuth: builder.mutation({
      query: ({ email, name, avatar }) => ({
        url: "social-auth",
        method: "POST",
        body: {
          email,
          name,
          avatar,
        },
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          Cookies.set("accessToken", result.data.accessToken);
          Cookies.set("refreshToken", result.data.refreshToken);

          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
              refreshToken: result.data.refreshToken,
            })
          );
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
    logOut: builder.query({
      query: () => ({
        url: "logout",
        method: "GET",
        credentials: "include" as const,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          dispatch(userLoggedOut());
        } catch (error: any) {
          console.log(error);
        }
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useActivationMutation,
  useLoginMutation,
  useVerifyOtpMutation, 
  useSocialAuthMutation,
  useLogOutQuery,
} = authApi;
