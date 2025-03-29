"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { MainFormProps } from "@/utils/constants/interfaces";

import { InputComponent as Input } from "./input";
import { MailComponent as Mail } from "./mail";
import { PhoneComponent as Phone } from "./phone";
import { TextAreaComponent as TextArea } from "./text-area";
import { PasswordComponent as Password } from "./password";

import { SearchComponent as Search } from "./search"
import { SelectComponent as Select } from "./select";
import { CheckboxComponent as Checkbox } from "./checkbox";
import { CheckboxGroupComponent as CheckboxGroup } from "./checkbox-group";

import { CalendarComponent as Calendar } from "./calendar";
import { DateRangeComponent as DateRange } from "./date-range";

import { FileComponent as File } from "./file";
import { ImgComponent as Image } from "./img";

import { LinkForm as Link } from "@/components/link"
import { TagInputComponent as TagInput } from "./tag-input"

import { Button } from "../button";

import { usePostProjectsMutation, usePostSprintsMutation, usePostTasksMutation } from "@/hooks/reducers/api";
import { usePostUserLoginMutation } from "@/hooks/reducers/auth";

export const MainForm = ({ message_button, dataForm, actionType, aditionalData, action, valueAssign, onSuccess }: MainFormProps) => {

  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    clearErrors,
    register,
    setError,
    watch,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useForm();

  const [postUserLogin] = usePostUserLoginMutation();
  const [postProjects] = usePostProjectsMutation();
  const [postSprint] = usePostSprintsMutation();
  const [postTask] = usePostTasksMutation();

  function getMutationFunction(actionType: string) {
    switch (actionType) {
      case "add-project":
        return postProjects;
      case "add-sprints":
        return postSprint;
      case "add-task":
        return postTask;
      case "post-login":
        return postUserLogin
      default:
        return () => { };
    }
  }

  async function onSubmit(submitData: any) {
    setLoading(true);
    let combinedData: any = {}
    if (aditionalData) combinedData = { ...submitData, ...aditionalData };
    else combinedData = submitData;
    const mutationFunction = getMutationFunction(actionType);
    try {
      const result = await mutationFunction(combinedData);
      if (onSuccess) {
        onSuccess(result, combinedData);
      }

      if (action) {
        const cleanKey = (key: string) => key.replace(/^'|'$/g, '');

        try {
          const payload = valueAssign
            ? Array.isArray(valueAssign)
              ? Object.fromEntries(
                valueAssign.map(key => [cleanKey(key), submitData[cleanKey(key)]])
              )
              : submitData[cleanKey(valueAssign)]
            : undefined;

          await (payload !== undefined ? action(payload) : action());
        } catch (error) {
          console.log('Error processing action:', error);
          // Considerar propagar el error o manejar según necesidad
        }
      }
    } catch (error) {
      console.log("Error en el envío del formulario:", error)
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 my-2 m-auto">
      {dataForm.map((field, key) => (
        <SwitchTypeInputRender
          key={key}
          cuestion={field}
          control={control}
          register={register}
          watch={watch}
          clearErrors={clearErrors}
          setError={setError}
          errors={errors}
          getValues={getValues}
          setValue={setValue}
        />
      ))}
      <Button
        color="info"
        type="submit"
        label={loading ? "Loading..." : message_button}
      />
    </form>
  );
};

export function SwitchTypeInputRender(props: any) {
  const { type } = props.cuestion;
  switch (type) {
    case "INPUT":
      return <Input {...props} />;
    case "PASSWORD":
      return <Password {...props} />
    case "PHONE":
      return <Phone {...props} />;
    case "TEXT_AREA":
      return <TextArea {...props} />;
    case "MAIL":
      return <Mail {...props} />;
    case "SELECT":
      return <Select {...props} />;
    case "DATE":
      return <Calendar {...props} />;
    case "DATE_RANGE":
      return <DateRange {...props} />;
    case "CHECKBOX":
      return <Checkbox {...props} />;
    case "CHECKBOX_GROUP":
      return <CheckboxGroup {...props} />;
    case "FILE":
      return <File {...props} />;
    case "IMG":
      return <Image {...props} />;
    case "SEARCH":
      return <Search {...props} />;
    case "LINK":
      return <Link {...props} />;
    case "TAG_INPUT":
      return <TagInput {...props} />;
    case "Flex":
      return <FlexComponent {...props} elements={props.cuestion.elements} />;
    default:
      return <h1>{type}</h1>;
  }
}
interface FlexProps {
  elements: any[];
  control: any;
  register: any;
  watch: any;
  clearErrors: any;
  setError: any;
  errors: any;
  getValues: any;
  setValue: any;
}

export const FlexComponent: React.FC<FlexProps> = ({
  elements,
  control,
  register,
  watch,
  clearErrors,
  setError,
  errors,
  getValues,
  setValue,
}) => {
  return (
    <div className="flex flex-wrap gap-4 justify-between min-w-full">
      {elements.map((element, index) => (
        <div key={index} className="flex-grow">
          <SwitchTypeInputRender
            cuestion={element}
            control={control}
            register={register}
            watch={watch}
            clearErrors={clearErrors}
            setError={setError}
            errors={errors}
            getValues={getValues}
            setValue={setValue}
          />
        </div>
      ))}
    </div>
  );
};
export default MainForm;