;
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

        getGlosariosCompras: builder.query({
            query: () => "glosarios/glosario-compras"
        }),
        getAll: builder.mutation({
            query: ({ sum, page, pageSize, filters, signal, distinct }) => ({
                url: `v1/reporteria/all`,
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
        getArticulos: builder.query({
            query: ({ page, pageSize, id, filtro, listaPrecio, signal }) => ({
                url: `pick-up/lista-precios`,
                method: "GET",
                params: {
                    page,
                    pageSize,
                    listaPrecio,
                    id,
                    filtro
                },
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),

        lazy: builder.query({
            query: ({ url, page, pageSize, filtro, signal }) => ({
                url: url,
                method: "GET",
                params: {
                    page,
                    pageSize,
                    ...filtro // Los filtros se envían como query parameters
                },
                signal
            }),
            transformErrorResponse: (response: any) => ({
                status: response.status,
                message: response.data?.message || 'Error fetching data',
            }),
            extraOptions: { maxRetries: 2 }
        }),
    }),
});

export const {
    useGetGlosariosComprasQuery,
    useGetAllMutation,
    useGetArticulosQuery,
    useLazyQuery,
} = api;
