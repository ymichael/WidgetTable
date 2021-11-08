import * as React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";

import { TableField, FieldType } from "../shared/types";
import { assertUnreachable } from "./utils";

import { FieldRow, ButtonRow } from "./FieldRow";
import CustomSelect from "./input/CustomSelect";

import styles from "./RowEditor.module.css";

export default function RowEditor({
  initialValues = {},
  tableSchema,
}: {
  initialValues: { [key: string]: any };
  tableSchema: TableField[];
}) {
  return (
    <div className={styles.RowEditor}>
      <h1>Edit Row</h1>
      <Formik
        initialValues={initialValues}
        onSubmit={(values, { setSubmitting }) => {
          console.log(values);
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
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
                        fieldName={field.fieldName}
                        fieldLabel={field.fieldName}
                      />
                    );
                  case FieldType.TEXT_MULTI_LINE:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldName}
                        fieldLabel={field.fieldName}
                        fieldAs="textarea"
                      />
                    );
                  case FieldType.CHECKBOX:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldName}
                        fieldLabel={field.fieldName}
                        fieldType="checkbox"
                      />
                    );
                  case FieldType.SELECT_MULTIPLE:
                  case FieldType.SELECT_SINGLE:
                    return (
                      <FieldRow
                        key={fieldKey}
                        fieldName={field.fieldName}
                        fieldLabel={field.fieldName}
                      >
                        <Field
                          name={field.fieldName}
                          component={CustomSelect}
                          options={field.fieldOptions.map((opt) => {
                            return { value: opt, label: opt };
                          })}
                          isMulti={fieldType === FieldType.SELECT_MULTIPLE}
                        />
                        <ErrorMessage name={field.fieldName} />
                      </FieldRow>
                    );
                  default:
                    assertUnreachable(fieldType);
                }
              })}
              <ButtonRow>
                <button type="submit" disabled={!formik.isValid}>
                  Update
                </button>
                <button type="submit" disabled={!formik.isValid}>
                  Save as new
                </button>
              </ButtonRow>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
