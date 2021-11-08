import * as React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import CustomSelect from "./input/CustomSelect";
import styles from "./App.module.css";
import { FieldRow } from "./FieldRow";
import SchemaEditor from "./SchemaEditor";

import { assertUnreachable } from "./utils";
import { TableField, FieldType } from "./constants";

// @ts-ignore
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

// @ts-ignore
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
      <SchemaEditor />
    </div>
  );
}

export default App;
