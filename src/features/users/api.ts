import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { firestoreService } from '@/services/firestore';
import { User } from '@/types/user';
import { where, orderBy } from 'firebase/firestore';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/users',
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      queryFn: async () => {
        try {
          const users = await firestoreService.getCollection<User>('users', [
            orderBy('createdAt', 'desc')
          ]);
          return { data: users };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: ['User'],
    }),
    getUserById: builder.query<User, string>({
      queryFn: async (id) => {
        try {
          const user = await firestoreService.getDocument<User>('users', id);
          if (!user) {
            return { error: { status: 'NOT_FOUND', error: 'User not found' } };
          }
          return { data: user };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, Omit<User, 'id' | 'createdAt' | 'updatedAt'>>({
      queryFn: async (userData) => {
        try {
          const id = await firestoreService.addDocument('users', userData);
          const newUser = await firestoreService.getDocument<User>('users', id);
          return { data: newUser! };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      queryFn: async ({ id, data }) => {
        try {
          await firestoreService.updateDocument('users', id, data);
          const updatedUser = await firestoreService.getDocument<User>('users', id);
          return { data: updatedUser! };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await firestoreService.deleteDocument('users', id);
          return { data: undefined };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;