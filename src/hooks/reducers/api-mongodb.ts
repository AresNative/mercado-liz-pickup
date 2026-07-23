// hooks/reducers/api-mongodb.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { EnvConfig } from "@/utils/constants/env.config";

const { apiMongoDb: apiUrl } = EnvConfig();

export type Message = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  actions?: Array<{
    label: string;
    action: "replace" | "remove";
    productId: string;
    productName: string;
  }>;
  chatId?: string;
};

export type User = {
  id: string;
  nombre: string;
  telefono: string;
  lastSeen?: number;
};

// ─── API RTK Query ──────────────────────────────
export const api_mongodb = createApi({
  reducerPath: "api_mongodb",
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    prepareHeaders: (headers) => {
      // Si necesitas API Key, descomenta:
      // const apiKey = import.meta.env.VITE_MONGO_API_KEY;
      // if (apiKey) headers.set("X-API-Key", apiKey);
      return headers;
    },
  }),
  tagTypes: ["Message", "User"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/db/users",
      providesTags: ["User"],
    }),
    updateUser: builder.mutation<void, { userId: string; data: Partial<User> }>(
      {
        query: ({ userId, data }) => ({
          url: `/db/users?id=${userId}`,
          method: "PUT",
          body: data,
        }),
        invalidatesTags: ["User"],
      },
    ),
    getMessages: builder.query<Message[], string>({
      query: (chatId) => `/db/messages?chatId=${encodeURIComponent(chatId)}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Message" as const, id })),
              { type: "Message", id: "LIST" },
            ]
          : [{ type: "Message", id: "LIST" }],
      transformResponse: (response: Message[]) =>
        response.map((msg) => ({
          ...msg,
          timestamp:
            typeof msg.timestamp === "string"
              ? Date.parse(msg.timestamp)
              : msg.timestamp,
        })),
    }),
    sendMessage: builder.mutation<
      { id: string },
      {
        chatId: string;
        text: string;
        userId: string;
        userName: string;
        actions?: Message["actions"];
      }
    >({
      query: (body) => ({
        url: "/db/messages",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Message", id: "LIST" },
      ],
    }),
    sendReplacementRequest: builder.mutation<
      { id: string },
      { chatId: string; productName: string }
    >({
      query: (body) => ({
        url: "/db/messages",
        method: "POST",
        body: {
          ...body,
          text: `Solicitud de reemplazo para ${body.productName}`,
        },
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Message", id: "LIST" },
      ],
    }),
  }),
});

// ─── Hooks generados (excluyendo pushercase) ────
export const {
  useGetUsersQuery,
  useUpdateUserMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useSendReplacementRequestMutation,
} = api_mongodb;
