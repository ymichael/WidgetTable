import * as React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import CustomSelect from "./CustomSelect";
import CustomMultiSelectTextInput from "./CustomMultiSelectTextInput";
import * as yup from "yup";
import "./App.css";

enum FieldType {
  TEXT_SINGLE_LINE = "TEXT_SINGLE_LINE",
  TEXT_MULTI_LINE = "TEXT_MULTI_LINE",
  CHECKBOX = "CHECKBOX",
  SELECT_SINGLE = "SELECT_SINGLE",
  SELECT_MULTIPLE = "SELECT_MULTIPLE",
  URL = "URL",
}

const FIELD_TYPE_READABLE: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Single line Text",
  TEXT_MULTI_LINE: "Multi-line Text",
  URL: "URL",
  CHECKBOX: "Checkbox",
  SELECT_SINGLE: "Single select",
  SELECT_MULTIPLE: "Multi select",
};

const FIELD_TYPE_DESCRIPTION: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Best for short text that fits on a single line.",
  TEXT_MULTI_LINE: "Ideal for long form text that spans multiple lines.",
  URL: "Use this if you intend to store a single URL in this field.",
  CHECKBOX: "Useful for true / false values.",
  SELECT_SINGLE:
    "Ideal when you want to ensure that one of a preset list of options is chosen.",
  SELECT_MULTIPLE:
    "Similar to single select field but allows for multiple options to be chosen.",
};

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

function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
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
              <div>
                <label htmlFor="fieldName">Field Name</label>
                <Field name="fieldName" type="text" />
                <ErrorMessage name="fieldName" />
              </div>
              <div>
                <label htmlFor="fieldType">Field Type</label>
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
                  <p>{FIELD_TYPE_DESCRIPTION[formik.values.fieldType]}</p>
                )}
                <ErrorMessage name="fieldType" />
              </div>
              {(formik.values.fieldType === FieldType.SELECT_SINGLE ||
                formik.values.fieldType === FieldType.SELECT_MULTIPLE) && (
                <div>
                  <b>Field Options:</b>
                  <Field
                    name="fieldOptions"
                    component={CustomMultiSelectTextInput}
                    onChange={(value: string[]) => {
                      formik.setFieldValue("fieldOptions", value);
                    }}
                  />
                  <ErrorMessage name="fieldOptions" />
                </div>
              )}
              <div>
                <button type="submit">Submit</button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

type TableFieldCommon = {
  fieldName: string;
  fieldType:
    | FieldType.TEXT_SINGLE_LINE
    | FieldType.TEXT_MULTI_LINE
    | FieldType.CHECKBOX
    | FieldType.URL;
};
type TableFieldSelect = {
  fieldName: string;
  fieldType: FieldType.SELECT_SINGLE | FieldType.SELECT_MULTIPLE;
  fieldOptions: string[];
};

type TableField = TableFieldCommon | TableFieldSelect;

type TableFields = TableField[];

const TEST_TABLE: TableFields = [
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

function TableRowDataForm({ tableSchema }: { tableSchema: TableFields }) {
  return (
    <div>
      <h1>Table Row Data Form</h1>
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
                      <div key={fieldKey}>
                        <label htmlFor={field.fieldName}>
                          {field.fieldName}
                        </label>
                        <Field name={field.fieldName} type="text" />
                        <ErrorMessage name={field.fieldName} />
                      </div>
                    );
                  case FieldType.TEXT_MULTI_LINE:
                    return (
                      <div key={fieldKey}>
                        <label htmlFor={field.fieldName}>
                          {field.fieldName}
                        </label>
                        <Field as="textarea" name={field.fieldName} />
                        <ErrorMessage name={field.fieldName} />
                      </div>
                    );
                  case FieldType.CHECKBOX:
                    return (
                      <div key={fieldKey}>
                        <label htmlFor={field.fieldName}>
                          {field.fieldName}
                        </label>
                        <Field name={field.fieldName} type="checkbox" />
                        <ErrorMessage name={field.fieldName} />
                      </div>
                    );
                  case FieldType.SELECT_MULTIPLE:
                  case FieldType.SELECT_SINGLE:
                    return (
                      <div key={fieldKey}>
                        <label htmlFor={field.fieldName}>
                          {field.fieldName}
                        </label>
                        <Field
                          name={field.fieldName}
                          component={CustomSelect}
                          options={field.fieldOptions.map((opt) => {
                            return { value: opt, label: opt };
                          })}
                          isMulti={fieldType === FieldType.SELECT_MULTIPLE}
                        />
                        <ErrorMessage name={field.fieldName} />
                      </div>
                    );
                  default:
                    assertUnreachable(fieldType);
                }
              })}
              <div>
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
    <div className="App">
      <TableFieldSchemaForm />
      <hr />
      <hr />
      <hr />
      <hr />
      <TableRowDataForm tableSchema={TEST_TABLE} />
    </div>
  );
}

export default App;
