import * as React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";

import { TableField, FieldType } from "../shared/types";
import { assertUnreachable } from "../shared/utils";

import { FieldRow, ButtonRow } from "./FieldRow";
import CustomSelect from "./input/CustomSelect";

import styles from "./RowEditor.module.css";

export default function RowEditor({
  initialValues = {},
  tableSchema,
  isEdit,
  onEdit,
  onDelete,
  onCreate,
}: {
  initialValues: { [key: string]: any };
  tableSchema: TableField[];
  isEdit: boolean;
  onEdit: (v: { [key: string]: any }) => void;
  onDelete: () => void;
  onCreate: (v: { [key: string]: any }) => void;
}) {
  return (
    <div className={styles.RowEditor}>
      <Formik
        initialValues={initialValues}
        onSubmit={(values, { setSubmitting }) => {
          if (isEdit) {
            onEdit(values);
          } else {
            onCreate(values);
          }
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h1>{isEdit ? "Edit Row" : "Add Row"}</h1>
                <ButtonRow>
                  {isEdit ? (
                    <>
                      <button type="submit" disabled={!formik.isValid}>
                        Update
                      </button>
                      <button
                        type="button"
                        disabled={!formik.isValid}
                        onClick={() => {
                          if (formik.isValid) {
                            onCreate(formik.values);
                          }
                        }}
                      >
                        Save as new
                      </button>
                      <button
                        type="button"
                        style={{ color: "#f10d0d" }}
                        onDoubleClick={() => {
                          onDelete();
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button type="submit" disabled={!formik.isValid}>
                      Add Row
                    </button>
                  )}
                </ButtonRow>
              </div>
              {tableSchema.map((field) => {
                // TODO (sanitize?)
                const fieldKey = field.fieldName;
                const fieldType = field.fieldType;

                switch (fieldType) {
                  case FieldType.TEXT_SINGLE_LINE:
                  case FieldType.URL:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldId}
                        fieldLabel={field.fieldName}
                      />
                    );
                  case FieldType.TEXT_MULTI_LINE:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldId}
                        fieldLabel={field.fieldName}
                        fieldAs="textarea"
                      />
                    );
                  case FieldType.CHECKBOX:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldId}
                        fieldLabel={field.fieldName}
                        fieldType="checkbox"
                      />
                    );
                  case FieldType.SELECT_MULTIPLE:
                  case FieldType.SELECT_SINGLE:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldId}
                        fieldLabel={field.fieldName}
                      >
                        <Field
                          name={field.fieldId}
                          component={CustomSelect}
                          options={field.fieldOptions.map((opt) => {
                            return { value: opt, label: opt };
                          })}
                          isMulti={fieldType === FieldType.SELECT_MULTIPLE}
                        />
                        <ErrorMessage name={field.fieldId} />
                      </FieldRow>
                    );
                  default:
                    assertUnreachable(fieldType);
                }
              })}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
