import * as React from "react";
import * as yup from "yup";
import { Formik, Form, Field } from "formik";

import { TableField, FieldType } from "../shared/types";
import { assertUnreachable } from "../shared/utils";

import { FieldRow, ButtonRow } from "./FieldRow";
import CustomSelect from "./input/CustomSelect";
import DatePicker from "./input/DatePicker";
import AutoSubmitter from "./AutoSubmitter";

import styles from "./RowEditor.module.css";

export function generateValidationSchemaFromTableSchema(
  tableSchema: TableField[]
): yup.BaseSchema {
  let yupSchema = yup.object();
  tableSchema.forEach((field) => {
    switch (field.fieldType) {
      case FieldType.TEXT_SINGLE_LINE:
      case FieldType.TEXT_MULTI_LINE:
        yupSchema = yupSchema.shape({ [field.fieldId]: yup.string() });
        break;
      case FieldType.NUMBER:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup
            .number()
            .typeError("Please specify a valid number."),
        });
        break;
      case FieldType.CURRENCY:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup
            .number()
            .typeError("Please specify a valid numerical value."),
        });
        break;
      case FieldType.DATE:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup
            .date()
            .default(function () {
              return new Date();
            })
            .typeError("Please specify a valid date. Eg. Nov 10 2021"),
        });
        break;
      case FieldType.EMAIL:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup.string().email("Please specify a valid email."),
        });
        break;
      case FieldType.URL:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup.string().url("Please specify a valid url."),
        });
        break;
      case FieldType.CHECKBOX:
        yupSchema = yupSchema.shape({ [field.fieldId]: yup.boolean() });
        break;
      case FieldType.SELECT_SINGLE:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup.string().oneOf(field.fieldOptions),
        });
        break;
      case FieldType.VOTE:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup.boolean(),
        });
        break;
      case FieldType.SELECT_MULTIPLE:
        yupSchema = yupSchema.shape({
          [field.fieldId]: yup
            .array()
            .of(yup.string().oneOf(field.fieldOptions)),
        });
        break;
      default:
        assertUnreachable(field);
    }
  });
  return yupSchema;
}

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
  onDelete: () => void;
  onEdit: (v: { [key: string]: any }, closeIframe: boolean) => void;
  onCreate: (v: { [key: string]: any }, closeIframe: boolean) => void;
}) {
  return (
    <div className={styles.RowEditor}>
      <Formik
        initialValues={initialValues}
        validationSchema={generateValidationSchemaFromTableSchema(tableSchema)}
        onSubmit={(values, { setSubmitting }) => {
          if (isEdit) {
            onEdit(values, true);
          } else {
            onCreate(values, true);
          }
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              {isEdit && (
                <AutoSubmitter
                  formik={formik}
                  onAutoSubmit={(v) => onEdit(v, false)}
                />
              )}
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
                        Done
                      </button>
                      <button
                        type="button"
                        style={{ color: "#f10d0d" }}
                        onClick={() => {
                          onDelete();
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="submit" disabled={!formik.isValid}>
                        Add
                      </button>
                    </>
                  )}
                </ButtonRow>
              </div>
              {tableSchema.map((field) => {
                return <RowFieldEditor key={field.fieldId} field={field} />;
              })}
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

export function RowFieldEditor({ field }: { field: TableField }) {
  const fieldKey = field.fieldId;
  const fieldType = field.fieldType;

  switch (fieldType) {
    case FieldType.TEXT_SINGLE_LINE:
    case FieldType.URL:
    case FieldType.EMAIL:
    case FieldType.CURRENCY:
    case FieldType.NUMBER:
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
    case FieldType.VOTE:
      return null;
    case FieldType.DATE:
      return (
        <FieldRow
          key={fieldKey}
          fieldName={field.fieldId}
          fieldLabel={field.fieldName}
        >
          <Field name={field.fieldId} component={DatePicker} />
        </FieldRow>
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
        </FieldRow>
      );
    default:
      assertUnreachable(fieldType);
  }
}
