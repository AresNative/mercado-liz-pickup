import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Interfaz base con propiedades comunes
export interface BaseAlertProps {
  title?: string;
  message: string;
  buttonText?: string;
  icon: "archivo" | "alert";
  type: "success" | "error" | "warning" | "completed" | "info";
  duration?: number;
  action?: (...args: any[]) => any;
}

// Interfaz específica para AlertProps
export interface AlertProps extends BaseAlertProps {
  // Aquí puedes agregar propiedades específicas si es necesario
}

// Interfaz específica para DropDowState
export interface DropDowState extends BaseAlertProps {
  modals: Record<string, boolean>;
  cuestionActivate: unknown; // Cambiado de `any` a `unknown` para mayor seguridad
}

const initialState: DropDowState = {
  title: "",
  message: "",
  buttonText: "",
  type: "completed",
  duration: 0,
  icon: "archivo",
  modals: {},
  cuestionActivate: null,
};

export const dropDow = createSlice({
  name: "dropDow",
  initialState,
  reducers: {
    openAlertReducer: (
      state,
      action: PayloadAction<AlertProps & { duration?: number }>
    ) => {
      const { title, message, buttonText, type, duration, icon } =
        action.payload;

      Object.assign(state, {
        title,
        message,
        buttonText,
        type,
        icon,
        duration: duration ?? 3000,
      });
    },
    openModalReducer: (
      state,
      action: PayloadAction<{ modalName: string; isOpen: boolean }>
    ) => {
      const { modalName, isOpen } = action.payload;
      state.modals[modalName] = isOpen;
    },
    closeModalReducer: (
      state,
      action: PayloadAction<{ modalName: string }>
    ) => {
      const { modalName } = action.payload;
      state.modals[modalName] = false;
    },
  },
});

export const { openAlertReducer, openModalReducer, closeModalReducer } =
  dropDow.actions;

export default dropDow.reducer;
