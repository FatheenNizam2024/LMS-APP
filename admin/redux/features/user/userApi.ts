import { apiSlice } from "../api/apiSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllAdmins: builder.query({ // Fetches from 'user' (now admin) model
      query: () => ({ url: "get-admins", method: "GET" }),
      providesTags: ["Users"],
    }),
    
    // NEW Endpoints for managing students
    getAllStudents: builder.query({
      query: () => ({ url: "admin/get-students", method: "GET" }),
      providesTags: (result) => result ? [...result.students.map(({ _id }: any) => ({ type: 'Students' as const, id: _id })), { type: 'Students', id: 'LIST' }] : [{ type: 'Students', id: 'LIST' }],
    }),
    adminCreateStudent: builder.mutation({
      query: (data) => ({ url: `admin/create-student`, method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Students', id: 'LIST' }],
    }),
    adminUpdateStudent: builder.mutation({
      query: ({ id, ...data }) => ({ url: `admin/update-student/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Students', id }],
    }),
    adminDeleteStudent: builder.mutation({
      query: (id) => ({ url: `admin/delete-student/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Students', id: 'LIST' }],
    }),
    updateStudentEnrollment: builder.mutation({
      query: ({ userId, courseId }) => ({
        url: `admin/update-student-enrollment`, // We will create this route next
        method: 'PUT',
        body: { userId, courseId }
      }),
      // This should invalidate the specific student to refetch their course list
      invalidatesTags: [{ type: 'Students', id: 'LIST' }, { type: 'Courses', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllAdminsQuery,
  useGetAllStudentsQuery,
  useAdminCreateStudentMutation,
  useAdminUpdateStudentMutation,
  useAdminDeleteStudentMutation,
  useUpdateStudentEnrollmentMutation,
} = userApi;