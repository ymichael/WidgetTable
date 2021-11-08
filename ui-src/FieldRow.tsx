import * as React from "react";
import { useState } from "react";
import { Field, ErrorMessage } from "formik";
import { genId } from "./utils";
import cx from "classnames";
import styles from "./FieldRow.module.css";

export function FieldRowSplit({ children }: { children: any }) {
  return <div className={styles.FieldRowSplit}>{children}</div>;
}

export function FieldRow({
  fieldName,
  fieldLabel,
  children,
  fieldAs = "input",
  fieldType = "text",
}: {
  fieldName: string;
  fieldLabel: string;
  fieldAs?: string;
  fieldType?: string;
  children?: any;
}) {
  const [id] = useState(genId);
  return (
    <div
      className={cx(
        styles.FieldRow,
        fieldType === "checkbox" && styles.FieldRowCheckbox
      )}
    >
      <label htmlFor={id}>{fieldLabel}</label>
      {children ? (
        children
      ) : (
        <Field
          id={id}
          name={fieldName}
          type={fieldType}
          as={fieldAs}
          autoComplete="off"
        />
      )}
      <div className={styles.FieldError}>
        <ErrorMessage name={fieldName} />
      </div>
    </div>
  );
}

export function ButtonRow({ children }: { children: any }) {
  return <div className={styles.ButtonRow}>{children}</div>;
}
