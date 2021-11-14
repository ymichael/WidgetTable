import * as React from "react";
import cx from "classnames";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Formik, Form, Field, useField } from "formik";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TableField, FieldType, TRow } from "../shared/types";
import AutoSubmitter from "./AutoSubmitter";
import Gear from "./icons/Gear";
import { generateValidationSchemaFromTableSchema } from "./RowEditor";
import { widthForFieldType, assertUnreachable } from "../shared/utils";
import CustomSelect from "./input/CustomSelect";
import styles from "./Table.module.css";

const getItemStyle = (isDragging: boolean, draggableStyle: any) => {
  return {
    userSelect: "none",
    backgroundColor: "#FFF",
    borderBottom: isDragging ? "solid 1px #eee" : "none",
    ...draggableStyle,
  };
};

export default function Table({
  title,
  tableSchema,
  rows,
  onRowEdit,
  onAppendRow,
  onRowReorder,
  onShowSidecar,
}: {
  title: string;
  tableSchema: TableField[];
  rows: TRow[];
  onRowEdit: (rowId: TRow["rowId"], v: TRow["rowData"]) => void;
  onAppendRow: () => TRow["rowId"];
  onShowSidecar: () => void;
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
    return generateValidationSchemaFromTableSchema(tableSchema);
  }, tableSchema);
  const onRowEditInner = useCallback((row, v) => {
    onRowEdit(row.rowId, v);
  }, []);

  return (
    <div className={styles.Table}>
      <div className={styles.TableHeader}>
        <div className={styles.TableHeaderSpacer}></div>
        <h1>{title}</h1>
        <div className={styles.TableHeaderSpacer} onClick={onShowSidecar}>
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
                  <TableAddRow tableSchema={tableSchema} onAdd={onAppendRow} />
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

function CellBox({
  field,
  children,
  isError = false,
}: {
  field: TableField;
  isError?: boolean;
  children: any;
}) {
  return (
    <div
      className={cx(styles.CellBox, isError && styles.CellBoxError)}
      style={{
        width: widthForFieldType(field.fieldType, true),
      }}
    >
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

function TableAddRow({
  tableSchema,
  onAdd,
}: {
  tableSchema: TableField[];
  onAdd: () => void;
}) {
  return (
    <div className={styles.TableRow} onClick={onAdd}>
      <RowIdx />
      <div className={styles.TableRowInner}>
        {tableSchema.map((field) => {
          return (
            <CellBox key={field.fieldId} field={field}>
              <textarea
                disabled
                autoComplete="off"
                style={{
                  resize: "none",
                  width: "100%",
                  height: "100%",
                  border: "none",
                  outline: "none",
                }}
              />
            </CellBox>
          );
        })}
      </div>
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
              {tableSchema.map((field, idx) => {
                return (
                  <TableCell
                    autoFocus={idx === 0}
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

function TableCell({
  field,
  value,
  autoFocus = false,
}: {
  field: TableField;
  value: any;
  autoFocus?: boolean;
}) {
  const fieldName = field.fieldId;
  const [, meta] = useField(fieldName);
  return (
    <CellBox field={field} isError={!!meta.error}>
      <CellEditor field={field} autoFocus={autoFocus} />
      {meta.error && <div className={styles.ErrorMsg}>{meta.error}</div>}
    </CellBox>
  );
}

function CellEditor({
  field,
  autoFocus = false,
}: {
  field: TableField;
  autoFocus?: boolean;
}) {
  const fieldName = field.fieldId;
  const fieldType = field.fieldType;
  switch (fieldType) {
    case FieldType.TEXT_SINGLE_LINE:
    case FieldType.URL:
    case FieldType.EMAIL:
    case FieldType.NUMBER:
    case FieldType.TEXT_MULTI_LINE:
      return (
        <Field
          name={fieldName}
          as="textarea"
          autoFocus={autoFocus}
          autoComplete="off"
          style={{
            resize: "none",
            width: "100%",
            height: "100%",
            border: "none",
            outline: "none",
          }}
        />
      );
    case FieldType.CHECKBOX:
      return <Field name={fieldName} type="checkbox" autoComplete="off" />;
    case FieldType.VOTE:
      return null;
    case FieldType.SELECT_MULTIPLE:
    case FieldType.SELECT_SINGLE:
      return (
        <Field
          name={fieldName}
          component={CustomSelect}
          options={field.fieldOptions.map((opt) => {
            return { value: opt, label: opt };
          })}
          isMulti={fieldType === FieldType.SELECT_MULTIPLE}
        />
      );
    default:
      assertUnreachable(fieldType);
  }
}
