"use client";
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
            headers.set("Content-Type", "application/json");
            const token = getLocalStorageItem("token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getReport: builder.query({
            query: (params) => `reporteria/${params}`,
        }),
        getAlmacen: builder.query({
            query: (params) => `reporteria/almacen?${params}`,
        }),
        getMovimientos: builder.query({
            query: (params) => `reporteria/movimientos?${params}`,
        }),

        /// * scrum
        getProjects: builder.query({
            query: () => `projects`,
        }),
        getSprints: builder.query({
            query: (params) => `projects/${params}/sprints`,
        }),
        getTasks: builder.query({
            query: (params) => `sprints/${params}/tasks`,
        }),
        getHsitoryTask: builder.query({
            query: (params) => `tasks/${params}/hsitory`,
        }),

        postProjects: builder.mutation({
            query: (data) => ({
                url: "projects",
                method: "POST",
                body: data,
            }),
        }),
        postSprints: builder.mutation({
            query: (data) => ({
                url: `projects/${data.project_id}/sprints`,
                method: "POST",
                body: data,
            }),
        }),
        postTasks: builder.mutation({
            query: (data) => ({
                url: "sprints/tasks",
                method: "POST",
                body: data,
            }),
        }),
        postComments: builder.mutation({
            query: (data) => ({
                url: `tasks/${data.taskId}/comments`,
                method: "POST",
                body: data,
            }),
        }),
        putTask: builder.mutation({
            query: ({ dataForm, idEdit }) => {
                return {
                    url: `tasks/${idEdit}/assing-user`,
                    method: "POST",
                    body: dataForm,
                };
            },
        }),
        putTaskStatus: builder.mutation({
            query: (data) => {
                return {
                    url: `tasks/${data.taskId}/update-status`,
                    method: "POST",
                    body: data,
                };
            },
        }),
        putTaskOrder: builder.mutation({
            query: (data) => {
                return {
                    url: `tasks/${data.taskId}/update-order?order=${data.order}`,
                    method: "POST",
                };
            },
        }),
        /// * scrum
        /* 
        ? Formato de consulta - glosarios y tablas dinamicas
        */
        getMermas: builder.mutation({
            query: (data) => ({
                url: `reporteria/mermas?sum=${data.sum}&page=${data.page}`,
                method: "POST",
                body: data.filters,
            }),
        }),
        getVentas: builder.mutation({
            query: ({ sum, page, pageSize, filters, signal, distinct }) => ({
                url: `reporteria/ventas`,
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
        getGlosariosVentas: builder.query({
            query: () => "glosarios/glosario-ventas"
        }),
        getCompras: builder.mutation({
            query: ({ sum, page, pageSize, filters, signal, distinct }) => ({
                url: `reporteria/compras`,
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
        getGlosariosCompras: builder.query({
            query: () => "glosarios/glosario-compras"
        }),
        getAll: builder.mutation({
            query: ({ sum, page, pageSize, filters, signal, distinct }) => ({
                url: `reporteria/all`,
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

        /*
        ? Formato de consulta - glosarios y tablas dinamicas
        */
    }),
});

export const {
    useGetReportQuery,


    useGetAlmacenQuery,
    useGetMovimientosQuery,

    useGetMermasMutation,
    useGetVentasMutation,
    useGetGlosariosVentasQuery,
    useGetComprasMutation,
    useGetGlosariosComprasQuery,
    useGetAllMutation,

    useGetProjectsQuery,
    useGetSprintsQuery,
    useGetTasksQuery,
    useGetHsitoryTaskQuery,
    usePostProjectsMutation,
    usePostSprintsMutation,
    usePostTasksMutation,
    usePostCommentsMutation,
    usePutTaskMutation,
    usePutTaskStatusMutation,
    usePutTaskOrderMutation
} = api;
