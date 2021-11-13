import * as React from "react";
import { useState } from "react";
import { Field, ErrorMessage, useField } from "formik";
import { genId } from "../shared/utils";
import cx from "classnames";
import styles from "./FieldRow.module.css";

export function FieldRowSplit({
  children,
  leftWidthPct = 0.3,
}: {
  children: any;
  leftWidthPct?: number;
}) {
  const [l, r] = React.Children.toArray(children);
  return (
    <div className={styles.FieldRowSplit}>
      <div style={{ padding: "5px", width: `${leftWidthPct * 100}%` }}>{l}</div>
      <div style={{ padding: "5px", width: `${(1 - leftWidthPct) * 100}%` }}>
        {r}
      </div>
    </div>
  );
}

export function FieldRow({
  fieldName,
  fieldLabel,
  children,
  compact = false,
  fieldAs = "input",
  fieldType = "text",
}: {
  fieldName: string;
  fieldLabel: string;
  fieldAs?: string;
  fieldType?: string;
  compact?: boolean;
  children?: any;
}) {
  const [, meta] = useField(fieldName);
  const [id] = useState(genId);
  const fieldStyle: any = {};
  if (compact && fieldAs === "textarea") {
    fieldAs = "input";
  }
  if (compact && meta.error) {
    fieldStyle.outline = "2px solid #bf0f10";
  }

  return (
    <div
      className={cx(
        styles.FieldRow,
        fieldType === "checkbox" && styles.FieldRowCheckbox,
        compact && styles.FieldRowCompact
      )}
    >
      {!compact && <label htmlFor={id}>{fieldLabel}</label>}
      {children ? (
        children
      ) : (
        <Field
          id={id}
          name={fieldName}
          type={fieldType}
          as={fieldAs}
          autoComplete="off"
          style={fieldStyle}
        />
      )}
      {!compact && (
        <div className={styles.FieldError}>
          <ErrorMessage name={fieldName} />
        </div>
      )}
    </div>
  );
}

export function ButtonRow({ children }: { children: any }) {
  return <div className={styles.ButtonRow}>{children}</div>;
}

export function Button(props: any) {
  return <button className={styles.Button} {...props} />;
}
