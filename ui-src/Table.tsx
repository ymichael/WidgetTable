import * as React from "react";
import { useMemo, useState } from "react";
import { Formik, Form } from "formik";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TableField, TRow } from "../shared/types";
import {
  RowFieldEditor,
  generateValidationSchemaFromTableSchema,
} from "./RowEditor";
import { widthForFieldType } from "../shared/utils";
import styles from "./Table.module.css";

const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
  return {
    userSelect: "none",
    backgroundColor: "#FFF",
    marginBottom: "10px",
    ...draggableStyle,
  };
};

function SettingsSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2A2A2A"
      stroke-width="1"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

export default function Table({
  title,
  tableSchema,
  rows,
}: {
  title: string;
  tableSchema: TableField[];
  rows: TRow[];
}) {
  const [rowIdsOrdered, setRowIdsOrdered] = useState<string[]>(
    rows.map((r) => r.rowId)
  );
  const rowById = useMemo<{ [key: string]: TRow }>(() => {
    const ret: { [key: string]: TRow } = {};
    rows.forEach((r) => {
      ret[r.rowId] = r;
    });
    return ret;
  }, [rows]);

  return (
    <div className={styles.Table}>
      <div className={styles.TableHeader}>
        <div style={{ margin: "0 10px" }}></div>
        {title}
        <div style={{ margin: "0 10px" }}>
          <SettingsSvg />
        </div>
      </div>
      <div className={styles.TableColumnHeader}>
        <RowIdx />
        {tableSchema.map((field) => {
          return <ColumnHeader key={field.fieldId} field={field} />;
        })}
      </div>
      <div>
        <DragDropContext
          onDragEnd={(result) => {
            console.log({ result });
            if (!result.destination) {
              return;
            }
            const arr = [...rowIdsOrdered];
            arr.splice(
              result.destination.index,
              0,
              arr.splice(result.source.index, 1)[0]
            );
            setRowIdsOrdered(arr);
          }}
        >
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <>
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {rowIdsOrdered.map((rowId, idx) => {
                    return (
                      <Draggable key={rowId} draggableId={rowId} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                          >
                            <TableRow
                              rowIdx={idx + 1}
                              tableSchema={tableSchema}
                              row={rowById[rowId]}
                              dragHandleProps={provided.dragHandleProps}
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
        </DragDropContext>
      </div>
    </div>
  );
}

function CellBox({ field, children }: { field: TableField; children: any }) {
  return (
    <div style={{ width: widthForFieldType(field.fieldType), margin: "0 5px" }}>
      {children}
    </div>
  );
}

function ColumnHeader({ field }: { field: TableField }) {
  return <CellBox field={field}>{field.fieldName}</CellBox>;
}

function RowIdx({ idx }: { idx?: number }) {
  return <div className={styles.RowIdx}>{idx ?? ""}</div>;
}

function TableRow({
  tableSchema,
  row,
  rowIdx,
  dragHandleProps,
}: {
  tableSchema: TableField[];
  row: TRow;
  rowIdx: number;
  dragHandleProps: any;
}) {
  return (
    <div className={styles.TableRow}>
      <div {...dragHandleProps} style={{ padding: "10px 0" }}>
        <RowIdx idx={rowIdx} />
      </div>
      <Formik
        initialValues={row.rowData}
        validationSchema={generateValidationSchemaFromTableSchema(tableSchema)}
        onSubmit={(values, { setSubmitting }) => {
          console.log({ values });
          setSubmitting(false);
        }}
      >
        {(formik) => {
          return (
            <Form onSubmit={formik.handleSubmit}>
              <div className={styles.TableRowInner}>
                {tableSchema.map((field) => {
                  return (
                    <TableCell
                      key={field.fieldId}
                      field={field}
                      value={row.rowData[field.fieldId]}
                    />
                  );
                })}
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}

function TableCell({ field, value }: { field: TableField; value: any }) {
  return (
    <CellBox field={field}>
      <RowFieldEditor compact={true} field={field} />
    </CellBox>
  );
}
