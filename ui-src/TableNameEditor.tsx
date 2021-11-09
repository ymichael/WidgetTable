import * as React from "react";
import { useRef, useEffect } from "react";
import * as yup from "yup";
import { Formik, Form, Field } from "formik";
import { FieldRow, Button } from "./FieldRow";
import styles from "./TableNameEditor.module.css";

const nameSchema = yup.object().shape({
  name: yup.string().required("Please specify a table name."),
});

export default function TableNameEditor({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit: (v: { name: string }) => void;
}) {
  const inputEl = useRef<any>(null);
  useEffect(() => {
    if (inputEl.current) {
      inputEl.current.focus();
    }
  }, []);
  return (
    <div className={styles.TableNameEditor}>
      <Formik
        initialValues={{ name }}
        validationSchema={nameSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              <div>
                <FieldRow fieldName="name" fieldLabel="Table Name">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Field
                      name="name"
                      type="text"
                      innerRef={inputEl}
                      style={{
                        flexBasis: "65%",
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!formik.isValid}
                      style={{
                        width: "150px",
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </FieldRow>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}
