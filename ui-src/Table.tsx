import * as React from "react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Formik, Form } from "formik";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TableField, TRow } from "../shared/types";
import AutoSubmitter from "./AutoSubmitter";
import Gear from "./icons/Gear";
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

export default function Table({
  title,
  tableSchema,
  rows,
  onRowEdit,
  onRowReorder,
}: {
  title: string;
  tableSchema: TableField[];
  rows: TRow[];
  onRowEdit: (rowId: TRow["rowId"], v: TRow["rowData"]) => void;
  onRowReorder: (args: {
    rowId: TRow["rowId"];
    beforeRowId: TRow["rowId"] | null;
    afterRowId: TRow["rowId"] | null;
  }) => void;
}) {
  const [rowIdsOrdered, setRowIdsOrdered] = useState<string[]>(
    rows.map((r) => r.rowId)
  );
  useEffect(() => {
    setRowIdsOrdered(rows.map((r) => r.rowId));
  }, [rows]);
  const rowById = useMemo(() => {
    const ret: { [key: string]: TRow } = {};
    rows.forEach((r) => {
      ret[r.rowId] = r;
    });
    return ret;
  }, [rows]);
  const validationSchema = useMemo(() => {
    generateValidationSchemaFromTableSchema(tableSchema);
  }, tableSchema);
  const onRowEditInner = useCallback((row, v) => {
    onRowEdit(row.rowId, v);
  }, []);

  return (
    <div className={styles.Table}>
      <div className={styles.TableHeader}>
        <div className={styles.TableHeaderSpacer}></div>
        {title}
        <div className={styles.TableHeaderSpacer}>
          <Gear />
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
            if (!result.destination) {
              return;
            }
            if (result.destination.index === result.source.index) {
              return;
            }
            const copyOfRowIds = [...rowIdsOrdered];
            const rowIdToMove = copyOfRowIds[result.source.index];
            copyOfRowIds.splice(
              result.destination.index,
              0,
              copyOfRowIds.splice(result.source.index, 1)[0]
            );
            const beforeRowId =
              copyOfRowIds[copyOfRowIds.indexOf(rowIdToMove) - 1] ?? null;
            const afterRowId =
              copyOfRowIds[copyOfRowIds.indexOf(rowIdToMove) + 1] ?? null;
            setRowIdsOrdered(copyOfRowIds);
            onRowReorder({ rowId: rowIdToMove, afterRowId, beforeRowId });
          }}
        >
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <>
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {rowIdsOrdered.map((rowId, idx) => {
                    return (
                      rowById[rowId] && (
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
                                validationSchema={validationSchema}
                                dragHandleProps={provided.dragHandleProps}
                                onEdit={onRowEditInner}
                              />
                            </div>
                          )}
                        </Draggable>
                      )
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
  validationSchema,
  onEdit,
}: {
  tableSchema: TableField[];
  row: TRow;
  rowIdx: number;
  dragHandleProps: any;
  validationSchema: any;
  onEdit: (row: TRow, v: { [key: string]: any }) => void;
}) {
  return (
    <div className={styles.TableRow}>
      <div
        {...dragHandleProps}
        style={{ padding: "10px 0" }}
        // Don't allow keyboard to TAB into the index
        tabIndex={-1}
      >
        <RowIdx idx={rowIdx} />
      </div>
      <TableRowFormMemo
        row={row}
        validationSchema={validationSchema}
        tableSchema={tableSchema}
        onEdit={onEdit}
      />
    </div>
  );
}

function TableRowForm({
  row,
  tableSchema,
  validationSchema,
  onEdit,
}: {
  row: TRow;
  tableSchema: TableField[];
  validationSchema: any;
  onEdit: (row: TRow, v: { [key: string]: any }) => void;
}) {
  return (
    <Formik
      initialValues={row.rowData}
      validationSchema={validationSchema}
      onSubmit={(values, { setSubmitting }) => {
        setSubmitting(false);
      }}
    >
      {(formik) => {
        return (
          <Form onSubmit={formik.handleSubmit}>
            <AutoSubmitter
              formik={formik}
              onAutoSubmit={(v) => onEdit(row, v)}
            />
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
  );
}

const TableRowFormMemo = React.memo(TableRowForm);

function TableCell({ field, value }: { field: TableField; value: any }) {
  return (
    <CellBox field={field}>
      <RowFieldEditor compact={true} field={field} />
    </CellBox>
  );
}
