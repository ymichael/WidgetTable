/**
 * Adapted from https://codesandbox.io/s/formik-react-select-multi-typescript-qsrj2?file=/src/CustomSelect.tsx:0-1259
 */
import { FieldProps } from "formik";
import React from "react";
import Select from "react-select";
import { useContext } from "react";
import ThemeContext from "../ThemeContext";
import { getTheme } from "../../shared/theme";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps extends FieldProps {
  options: Option[];
  isMulti?: boolean;
  className?: string;
  placeholder?: string;
}

export default function CustomSelect({
  className,
  placeholder,
  field,
  form,
  options,
  isMulti = false,
}: CustomSelectProps) {
  const theme = getTheme(useContext(ThemeContext));

  const onChange = (option: Option | Option[]) => {
    form.setFieldValue(
      field.name,
      isMulti
        ? (option as Option[]).map((item: Option) => item.value)
        : (option as Option).value
    );
  };

  const getValue = () => {
    if (options) {
      return isMulti
        ? options.filter((option) => field.value?.indexOf(option.value) >= 0)
        : options.find((option) => option.value === field.value);
    } else {
      return isMulti ? [] : ("" as any);
    }
  };

  return (
    <Select
      className={className}
      name={field.name}
      value={getValue()}
      onChange={onChange}
      placeholder={placeholder}
      options={options}
      isMulti={isMulti}
      theme={(og) => {
        return {
          ...og,
          colors: {
            ...og.colors,
            primary25: theme.LIGHT,
            primary50: theme.LIGHT,
            primary75: theme.LIGHT,
            primary: theme.PRIMARY,
          },
        };
      }}
    />
  );
}
