import { EnvConfig } from "@/utils/constants/env.config";
import { getLocalStorageItem } from "@/utils/functions/local-storage";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const getUserData = () => getLocalStorageItem("user_data");
const { api: apiUrl } = EnvConfig();

export const api = createApi({
    reducerPath: "api",
    refetchOnFocus: true,
    keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
    refetchOnMountOrArgChange: true, // Mejor control de refetch
    baseQuery: fetchBaseQuery({
        baseUrl: apiUrl,
        prepareHeaders: (headers, { }) => {
            // Headers para ocultar información
            headers.set('X-Requested-With', 'XMLHttpRequest');
            headers.set('X-Application', 'WebApp');
            headers.set('Pragma', 'no-cache');
            headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            headers.set('Expires', '0');

            // Ocultar contenido type
            const token = getLocalStorageItem("token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getAll: builder.mutation({
            query: ({ url, filters, signal, page, pageSize, sum, distinct }) => ({
                url: `v2/${url}`,
                method: "POST",
                params: { sum, page, pageSize, distinct }, // Mejor práctica para parámetros
                body: filters,
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
        get: builder.query({
            query: ({ url, signal }) => ({
                url: `${url}/consultar`,
                method: "GET",
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        getGeneral: builder.query({
            query: ({ param, signal }) => ({
                url: `/consultar`,
                method: "GET",
                params: { param },
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        getPerIds: builder.query({
            query: ({ url, id, signal }) => ({
                url: `${url}/consultar/${id}`,
                method: "GET",
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        getWithFilters: builder.mutation({
            query: ({ url, page, pageSize, filtros, signal }) => ({
                url: `${url}/consultar/filtros`,
                method: "POST",
                params: {
                    page,
                    pageSize,
                },
                body: filtros,
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        getWithFiltersGeneral: builder.mutation({
            query: ({ table, page, pageSize, filtros, signal }) => ({
                url: `/v1/consultar/filtros`,
                method: "POST",
                params: {
                    page,
                    table, // tabla a consultar
                    pageSize,
                },
                body: filtros,
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        post: builder.mutation({
            query: ({ url, data, signal }) => ({
                url: `${url}/register`,
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        postGeneral: builder.mutation({
            query: ({ table, data, signal }) => ({
                url: `v1/register`,
                method: "POST",
                params: { table },
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
        put: builder.mutation({
            query: ({ url, id, data, signal }) => ({
                url: `${url}/update/${id}`,
                method: "PUT",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),

        putGeneral: builder.mutation({
            query: ({ table, id, data, signal }) => ({
                url: `v1/update/${id}`,
                method: "PUT",
                params: { table },
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
                signal,
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || "Error fetching data",
            }),
            extraOptions: { maxRetries: 2 },
        }),
    }),
});

export const {
    useGetAllMutation,
    useGetQuery,
    useGetGeneralQuery,
    useGetPerIdsQuery,
    useGetWithFiltersMutation,
    useGetWithFiltersGeneralMutation,
    usePostMutation,
    usePostGeneralMutation,
    usePutMutation,
    usePutGeneralMutation,
} = api;
