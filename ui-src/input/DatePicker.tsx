import * as React from "react";
import { FieldProps } from "formik";
import { format, parse } from "date-fns";
import DatePicker from "react-datepicker";

interface DatePickerProps extends FieldProps {
  compact?: boolean;
}

const DATE_FMT = "MMM d yyyy";

export default function ({ field, form, compact = false }: DatePickerProps) {
  const commonProps = {
    readOnly: true,
    autoComplete: "off",
    name: field.name,
    value: field.value,
  };
  return (
    <div
      style={{
        display: "flex",
        flex: "1 1 auto",
        alignItems: "center",
      }}
    >
      <DatePicker
        selected={field.value && parse(field.value, DATE_FMT, new Date())}
        dateFormat={DATE_FMT}
        onChange={(date) => {
          if (date) {
            form.setFieldValue(field.name, format(date as any, DATE_FMT));
            form.setFieldTouched(field.name);
          } else {
            form.setFieldValue(field.name, "");
            form.setFieldTouched(field.name);
          }
        }}
        customInput={
          compact ? (
            <textarea
              style={{
                resize: "none",
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
              }}
              {...commonProps}
            />
          ) : (
            <input
              type="text"
              style={{ flex: "1 1 auto", width: "100%" }}
              {...commonProps}
            />
          )
        }
      />
    </div>
  );
}
