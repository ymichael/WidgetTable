import * as React from "react";
import { useState } from "react";
import { Field, ErrorMessage } from "formik";
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
  showLabel = true,
  fieldAs = "input",
  fieldType = "text",
}: {
  fieldName: string;
  showLabel?: boolean;
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
      {showLabel && <label htmlFor={id}>{fieldLabel}</label>}
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

export function Button(props: any) {
  return <button className={styles.Button} {...props} />;
}
