import { EnvConfig } from "@/utils/constants/env.config";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getLocalStorageItem } from "@/utils/functions/local-storage";

const { api_int: apiUrl } = EnvConfig();

export const api_int = createApi({
  reducerPath: "api_int",
  refetchOnFocus: true,
  keepUnusedDataFor: 10, // Reducir tiempo de caché para datos no usados
  refetchOnMountOrArgChange: true, // Mejor control de refetch
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: async (headers, {}) => {
      headers.set("Content-Type", "application/json");
      const token = getLocalStorageItem("token"); // <- usa cookie
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    get: builder.mutation({
      query: ({ url, filters, signal, page, pageSize, sum, distinct }) => ({
        url: `v2/${url}`,
        method: "POST",
        params: { sum, page, pageSize, distinct }, // Mejor práctica para parámetros
        body: filters,
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    postIntelisis: builder.mutation({
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
    putIntelisis: builder.mutation({
      query: ({ table, data, signal }) => ({
        url: `v1/update/${table}`,
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
    getArticulos: builder.query({
      query: ({ page, pageSize, filtro, listaPrecio, signal }) => ({
        url: `Precios`,
        method: "GET",
        params: {
          page,
          pageSize,
          listaPrecio,
          filtro, // codigo de barras o nombre
        },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
    getWithFiltersGeneralInIntelisis: builder.mutation({
      query: ({ table, page, pageSize, filtros, signal }) => ({
        url: `/v1/consultar`,
        method: "POST",
        params: {
          fromClause: table, // tabla a consultar
        },
        body: { ...filtros, page, pageSize }, // Enviar filtros en el body
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error fetching data",
      }),
      extraOptions: { maxRetries: 2 },
    }),

    // Agregar este endpoint a tu api.ts
    deleteIntelisis: builder.mutation({
      query: ({ table, column, id, signal }) => ({
        url: `v1/delete/${id}`,
        method: "DELETE",
        params: { column, table },
        signal,
      }),
      transformErrorResponse: (response: any) => ({
        status: response.status,
        message: response.data?.message || "Error deleting data",
      }),
      extraOptions: { maxRetries: 2 },
    }),
  }),
});

export const {
  useGetMutation,
  usePostIntelisisMutation,
  useGetArticulosQuery,
  useGetWithFiltersGeneralInIntelisisMutation,
  usePutIntelisisMutation,
  useDeleteIntelisisMutation,
} = api_int;
