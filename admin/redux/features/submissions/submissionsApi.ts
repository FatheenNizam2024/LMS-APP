// C:\LMS App copy Part 2\Lms-App - Copy\admin\redux\features\submissions\submissionsApi.ts

import { apiSlice } from "../api/apiSlice";

export const submissionsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAssignmentSubmissions: builder.query({
            query: (courseId) => ({
                url: `assignment-submissions/${courseId}`,
                method: 'GET',
                credentials: 'include' as const,
            }),
            // MODIFICATION: Use a more specific, result-based tagging system
            providesTags: (result) =>
                result?.submissions
                    ? [
                        ...result.submissions.map(({ _id }: { _id: string }) => ({ type: 'AssignmentSubmissions' as const, id: _id })),
                        { type: 'AssignmentSubmissions', id: 'LIST' },
                      ]
                    : [{ type: 'AssignmentSubmissions', id: 'LIST' }],
        }),
        deleteAssignmentSubmission: builder.mutation({
            query: (submissionId) => ({
                url: `assignment-submission/${submissionId}`,
                method: 'DELETE',
                credentials: 'include' as const,
            }),
            // MODIFICATION: Invalidate the generic LIST tag to force a refetch
            invalidatesTags: [{ type: 'AssignmentSubmissions', id: 'LIST' }],
        }),
        gradeAssignmentSubmission: builder.mutation({
            query: ({ submissionId, grade, feedback, status }) => ({ // Added status
                url: `grade-assignment/${submissionId}`,
                method: 'PUT',
                body: { grade, feedback, status }, // Added status
                credentials: 'include' as const,
            }),
            // MODIFICATION: Invalidate the specific submission tag that was updated
            invalidatesTags: (result, error, { submissionId }) => [{ type: 'AssignmentSubmissions', id: submissionId }],
        }),
        getQuizSubmissions: builder.query({
            query: (courseId) => ({
                url: `quiz-submissions/${courseId}`,
                method: 'GET',
                credentials: 'include' as const,
            }),
            providesTags: ['QuizSubmissions'],
        }),
        deleteQuizSubmission: builder.mutation({
            query: (submissionId) => ({
                url: `quiz-submission/${submissionId}`,
                method: 'DELETE',
                credentials: 'include' as const,
            }),
            invalidatesTags: ['QuizSubmissions'],
        }),
        updateQuizSubmissionScore: builder.mutation({
            query: ({ submissionId, score }) => ({
                url: `quiz-submission-score/${submissionId}`,
                method: 'PUT',
                body: { score },
                credentials: 'include' as const,
            }),
            invalidatesTags: ['QuizSubmissions'],
        }),
    }),
});

export const { 
    useGetAssignmentSubmissionsQuery, 
    useDeleteAssignmentSubmissionMutation,
    useGradeAssignmentSubmissionMutation,
    useGetQuizSubmissionsQuery,
    useDeleteQuizSubmissionMutation,
    useUpdateQuizSubmissionScoreMutation,
} = submissionsApi;