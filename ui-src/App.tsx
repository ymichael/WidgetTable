import * as React from "react";
import { useState } from "react";
import cx from "classnames";
import { Formik, Form, Field, ErrorMessage } from "formik";
import CustomSelect from "./input/CustomSelect";
import CustomMultiSelectTextInput from "./input/CustomMultiSelectTextInput";
import * as yup from "yup";
import styles from "./App.module.css";

import { assertUnreachable, genId } from "./utils";
import {
  TableField,
  FieldType,
  FIELD_TYPE_READABLE,
  FIELD_TYPE_DESCRIPTION,
} from "./constants";

const fieldSchema = yup.object().shape({
  fieldName: yup.string().required("Please specify a field name."),
  fieldType: yup.string().oneOf(Object.values(FieldType)),
  fieldOptions: yup.array().when("fieldType", {
    is: (ty: any) => {
      return ty === FieldType.SELECT_SINGLE || ty === FieldType.SELECT_MULTIPLE;
    },
    then: yup
      .array()
      .compact()
      .of(yup.string())
      .min(1, "Please specify at least one option for this field"),
    otherwise: yup.array(),
  }),
});

function FieldRow({
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

function TableFieldSchemaForm() {
  return (
    <div>
      <h1>Table Field Schema Form</h1>
      <Formik
        initialValues={{
          fieldName: "",
          fieldType: FieldType.TEXT_SINGLE_LINE,
          fieldOptions: [],
        }}
        validationSchema={fieldSchema}
        onSubmit={(values, { setSubmitting }) => {
          console.log(values);
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              <FieldRow fieldName="fieldName" fieldLabel="Field Name" />
              <FieldRow fieldName="fieldType" fieldLabel="Field Type">
                <Field
                  name="fieldType"
                  component={CustomSelect}
                  options={Object.values(FieldType).map((fieldType) => {
                    return {
                      value: fieldType,
                      label: FIELD_TYPE_READABLE[fieldType],
                    };
                  })}
                />
                {formik.values.fieldType && (
                  <div
                    style={{
                      padding: "2px",
                      fontSize: "12px",
                      color: "#666666",
                    }}
                  >
                    {FIELD_TYPE_DESCRIPTION[formik.values.fieldType]}
                  </div>
                )}
              </FieldRow>
              {(formik.values.fieldType === FieldType.SELECT_SINGLE ||
                formik.values.fieldType === FieldType.SELECT_MULTIPLE) && (
                <FieldRow fieldName="fieldOptions" fieldLabel="Field Options">
                  <Field
                    name="fieldOptions"
                    component={CustomMultiSelectTextInput}
                    onChange={(value: string[]) => {
                      formik.setFieldValue("fieldOptions", value);
                    }}
                  />
                </FieldRow>
              )}
              <div className={styles.FormButton}>
                <button type="submit">Submit</button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

const TEST_TABLE: TableField[] = [
  { fieldName: "Title", fieldType: FieldType.TEXT_SINGLE_LINE },
  { fieldName: "Description", fieldType: FieldType.TEXT_MULTI_LINE },
  { fieldName: "Published", fieldType: FieldType.CHECKBOX },
  {
    fieldName: "Status",
    fieldType: FieldType.SELECT_SINGLE,
    fieldOptions: ["Draft", "In Review", "Ready"],
  },
  {
    fieldName: "Tags",
    fieldType: FieldType.SELECT_MULTIPLE,
    fieldOptions: ["Eng", "Design", "Data", "General"],
  },
];

function TableFieldRowDataForm({ tableSchema }: { tableSchema: TableField[] }) {
  return (
    <div>
      <h1>Table FieldRow Data Form</h1>
      <Formik
        initialValues={{}}
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
              <div className={styles.FormButton}>
                <button type="submit">Submit</button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

function App() {
  return (
    <div className={styles.App}>
      <TableFieldSchemaForm />
      <hr />
      <hr />
      <hr />
      <hr />
      <TableFieldRowDataForm tableSchema={TEST_TABLE} />
    </div>
  );
}

export default App;
