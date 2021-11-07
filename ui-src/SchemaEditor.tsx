import * as React from "react";
import * as yup from "yup";
import { Formik, Form, Field } from "formik";
import {
  FieldType,
  FIELD_TYPE_READABLE,
  FIELD_TYPE_DESCRIPTION,
} from "./constants";
import { FieldRow, FieldRowSplit } from "./FieldRow";
import CustomSelect from "./input/CustomSelect";
import CustomMultiSelectTextInput from "./input/CustomMultiSelectTextInput";
import styles from "./SchemaEditor.module.css";

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

export default function SchemaEditor({ fieldIdx }: { fieldIdx: number }) {
  return (
    <div className={styles.FieldSchemaForm}>
      <div className={styles.FieldSchemaFormIndex}>{fieldIdx}</div>
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
              <FieldRowSplit>
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
              </FieldRowSplit>
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
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
