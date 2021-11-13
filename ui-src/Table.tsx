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
    marginBottom: "15px",
    ...draggableStyle,
  };
};

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
        <RowIdx />
        {tableSchema.map((field) => {
          return <ColumnHeader key={field.fieldId} field={field} />;
        })}
      </div>
      <div>
        <DragDropContext
          onDragEnd={(result) => {
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
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                          >
                            <TableRow
                              rowIdx={idx + 1}
                              tableSchema={tableSchema}
                              row={rowById[rowId]}
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
}: {
  tableSchema: TableField[];
  row: TRow;
  rowIdx: number;
}) {
  return (
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
            <div className={styles.TableRow}>
              <RowIdx idx={rowIdx} />
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
  );
}

function TableCell({ field, value }: { field: TableField; value: any }) {
  return (
    <CellBox field={field}>
      <RowFieldEditor compact={true} field={field} />
    </CellBox>
  );
}
