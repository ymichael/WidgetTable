import * as React from "react";
import * as yup from "yup";
import { Formik, Form, Field, FieldArray } from "formik";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  FieldType,
  FIELD_TYPE_READABLE,
  FIELD_TYPE_DESCRIPTION,
} from "./constants";
import { FieldRow, FieldRowSplit, ButtonRow } from "./FieldRow";
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

const fieldsSchema = yup.object().shape({
  fields: yup
    .array()
    .of(fieldSchema)
    .min(1, "Please specify at least one field")
    .test(
      "is-unique",
      "Please ensure that all field names are unique.",
      (value: any[] | undefined) => {
        const fieldNames = (value || [])
          .filter(Boolean)
          .map((x) => x.fieldName);
        return fieldNames.length === new Set([...fieldNames]).size;
      }
    ),
});

const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
  return {
    userSelect: "none",
    marginBottom: "15px",
    borderRadius: "4px",
    border: isDragging ? "solid 2px #A83FFB" : "solid 1px hsl(0, 0%, 80%)",
    backgroundColor: "#FFF",
    ...draggableStyle,
  };
};

export default function SchemaEditor() {
  return (
    <div className={styles.SchemaEditor}>
      <div>
        <h1>Table Schema</h1>
      </div>
      <Formik
        initialValues={{
          fields: [
            {
              fieldName: "Title",
              fieldType: FieldType.TEXT_SINGLE_LINE,
              fieldOptions: [],
            },
            {
              fieldName: "Description",
              fieldType: FieldType.TEXT_MULTI_LINE,
              fieldOptions: [],
            },
          ],
        }}
        validationSchema={fieldsSchema}
        onSubmit={(values, { setSubmitting }) => {
          console.log(values);
          setSubmitting(false);
        }}
      >
        {(formik) => {
          const fieldsError = formik.errors?.fields || "";
          return (
            <Form onSubmit={formik.handleSubmit}>
              <FieldArray
                name="fields"
                render={(arrayHelpers) => {
                  return (
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) {
                          return;
                        }
                        arrayHelpers.move(
                          result.source.index,
                          result.destination.index
                        );
                      }}
                    >
                      <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                          <>
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {formik.values.fields.map((field, idx) => {
                                return (
                                  <Draggable
                                    key={idx}
                                    draggableId={`${idx}`}
                                    index={idx}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={getItemStyle(
                                          snapshot.isDragging,
                                          provided.draggableProps.style
                                        )}
                                      >
                                        <SchemaFieldForm
                                          isRemovable={
                                            formik.values.fields.length > 1
                                          }
                                          onRemove={() => {
                                            arrayHelpers.remove(idx);
                                          }}
                                          setFieldValue={formik.setFieldValue}
                                          fieldIdx={idx}
                                          values={field}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                            {provided.placeholder}
                          </>
                        )}
                      </Droppable>

                      <button
                        type="button"
                        className={styles.NewFieldButton}
                        onClick={() => {
                          arrayHelpers.push({
                            fieldName: "",
                            fieldType: FieldType.TEXT_SINGLE_LINE,
                            fieldOptions: [],
                          });
                        }}
                      >
                        New Field
                      </button>
                    </DragDropContext>
                  );
                }}
              />

              <ButtonRow>
                <button type="submit" disabled={!formik.isValid}>
                  Save Changes
                </button>
                {fieldsError && typeof fieldsError === "string" && (
                  <div className={styles.FieldError}>{fieldsError}</div>
                )}
              </ButtonRow>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

function SchemaFieldForm({
  fieldIdx,
  values = {},
  setFieldValue,
  isRemovable,
  onRemove,
}: {
  fieldIdx: number;
  values: Partial<{
    fieldName: string;
    fieldType: FieldType;
    fieldOptions: string[];
  }>;
  setFieldValue: (k: string, v: any) => void;
  isRemovable: boolean;
  onRemove: () => void;
}) {
  const fieldPrefix = `fields.${fieldIdx}`;
  return (
    <div className={styles.SchemaFieldForm}>
      <div className={styles.SchemaFieldFormMeta}>
        <span>{fieldIdx + 1}.</span>
        {isRemovable && (
          <a
            onClick={onRemove}
            style={{
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Remove
          </a>
        )}
      </div>

      <FieldRowSplit>
        <FieldRow
          fieldName={`${fieldPrefix}.fieldName`}
          fieldLabel="Field Name"
        />
        <FieldRow
          fieldName={`${fieldPrefix}.fieldType`}
          fieldLabel="Field Type"
        >
          <Field
            name={`${fieldPrefix}.fieldType`}
            component={CustomSelect}
            options={Object.values(FieldType).map((fieldType) => {
              return {
                value: fieldType,
                label: FIELD_TYPE_READABLE[fieldType],
              };
            })}
          />
          {values.fieldType && (
            <div style={{ padding: "2px", fontSize: "12px", color: "#666666" }}>
              {FIELD_TYPE_DESCRIPTION[values.fieldType]}
            </div>
          )}
        </FieldRow>
      </FieldRowSplit>
      {(values.fieldType === FieldType.SELECT_SINGLE ||
        values.fieldType === FieldType.SELECT_MULTIPLE) && (
        <FieldRow
          fieldName={`${fieldPrefix}.fieldOptions`}
          fieldLabel="Field Options"
        >
          <Field
            fieldName={`${fieldPrefix}.fieldOptions`}
            component={CustomMultiSelectTextInput}
            onChange={(value: string[]) => {
              setFieldValue(`${fieldPrefix}.fieldOptions`, value);
            }}
          />
        </FieldRow>
      )}
    </div>
  );
}
