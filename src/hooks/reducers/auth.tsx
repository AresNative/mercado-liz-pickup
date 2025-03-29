"use client";
import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem, setLocalStorageItem } from "@/utils/functions/local-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const getUserData = () => getLocalStorageItem("user_data");
const { api: apiUrl } = EnvConfig();

export const auth = createApi({
    reducerPath: "auth",
    refetchOnFocus: true,
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers) => {
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        postUserRegister: builder.mutation({
            query: (data) => ({
                url: "users/register",
                method: "POST",
                body: data,
            }),
        }),
        postUserLogin: builder.mutation({
            query: (data) => ({
                url: "users/login",
                method: "POST",
                body: data,
            }),
            onQueryStarted: async (data, { queryFulfilled }) => {
                try {
                    const { data: responseData } = await queryFulfilled;
                    // Verifica si la respuesta contiene un token
                    if (responseData.token) {
                        // Guardar el token en localStorage
                        setLocalStorageItem("user-role", "user")
                        setLocalStorageItem("token", responseData.token);
                    }
                } catch (error) {
                    console.log("Error al hacer login:", error);
                }
            },
        }),
        postLogut: builder.mutation({
            query: (data) => ({
                url: `users/logout`,
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    usePostLogutMutation,
    usePostUserLoginMutation,
    usePostUserRegisterMutation,
} = auth;
