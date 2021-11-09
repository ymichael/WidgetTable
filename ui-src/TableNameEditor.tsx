import * as React from "react";
import { useRef, useEffect } from "react";
import * as yup from "yup";
import { Formik, Form, Field } from "formik";
import { FieldRow, Button } from "./FieldRow";
import AutoSubmitter from "./AutoSubmitter";
import styles from "./TableNameEditor.module.css";

const nameSchema = yup.object().shape({
  name: yup.string().required("Please specify a table name."),
});

export default function TableNameEditor({
  name,
  onSubmit,
}: {
  name: string;
  onSubmit: (v: { name: string }, closeIframe: boolean) => void;
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
          onSubmit(values, true);
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              <AutoSubmitter
                formik={formik}
                onAutoSubmit={(v) => onSubmit(v, false)}
              />
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
                      Done
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
