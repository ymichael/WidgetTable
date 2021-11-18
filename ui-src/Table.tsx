import * as React from "react";
import cx from "classnames";
import { useCallback, useMemo } from "react";
import { Formik, Form, Field, useField } from "formik";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { TableField, FieldType, TRow } from "../shared/types";
import AutoSubmitter from "./AutoSubmitter";
import Gear from "./icons/Gear";
import Trash from "./icons/Trash";
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

function shouldSkipField(field: TableField): boolean {
  return field.fieldType === FieldType.VOTE;
}

export default function Table({
  title,
  tableSchema,
  rows,
  onEditTitle,
  onRowEdit,
  onDeleteRow,
  onAppendRow,
  onRowReorder,
  onShowSidecar,
}: {
  title: string;
  tableSchema: TableField[];
  rows: TRow[];
  onRowEdit: (rowId: TRow["rowId"], v: TRow["rowData"]) => void;
  onDeleteRow: (rowId: TRow["rowId"]) => void;
  onAppendRow: () => TRow["rowId"];
  onShowSidecar: () => void;
  onEditTitle: (title: string) => void;
  onRowReorder: (args: {
    rowId: TRow["rowId"];
    beforeRowId: TRow["rowId"] | null;
    afterRowId: TRow["rowId"] | null;
  }) => void;
}) {
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
    <>
      <div className={styles.TableTopBar}></div>
      <div className={styles.Table}>
        <div className={cx(styles.TableHeader)}>
          <div className={styles.TableSettings} onClick={onShowSidecar}>
            <Gear />
          </div>
          <TableTitle title={title} onEditTitle={onEditTitle} />
        </div>
        <div className={styles.TableBody}>
          <div className={cx(styles.TableColumnHeader, styles.uSticky)}>
            <RowIdx />
            <div className={styles.TableRowInner}>
              {tableSchema.map((field) => {
                if (shouldSkipField(field)) {
                  return null;
                }
                return <ColumnHeader key={field.fieldId} field={field} />;
              })}
              <ActionCellBox></ActionCellBox>
            </div>
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
                const copyOfRowIds = rows.map((x) => x.rowId);
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
                onRowReorder({
                  rowId: rowIdToMove,
                  afterRowId,
                  beforeRowId,
                });
              }}
            >
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <>
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {rows.map(({ rowId }, idx) => {
                        return (
                          rowById[rowId] && (
                            <Draggable
                              key={rowId}
                              draggableId={rowId}
                              index={idx}
                            >
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
                                    onDelete={onDeleteRow}
                                  />
                                </div>
                              )}
                            </Draggable>
                          )
                        );
                      })}
                      <TableAddRow
                        tableSchema={tableSchema}
                        onAdd={onAppendRow}
                      />
                    </div>
                    {provided.placeholder}
                  </>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </>
  );
}

function TableTitle({
  title,
  onEditTitle,
}: {
  title: string;
  onEditTitle: (title: string) => void;
}) {
  return (
    <div className={styles.TableTitle}>
      <input
        type="text"
        value={title}
        autoComplete="off"
        onChange={(e) => {
          onEditTitle(e.target.value);
        }}
      />
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
        flex: `1 1 auto`,
        width: widthForFieldType(field.fieldType, true),
      }}
    >
      {children}
    </div>
  );
}

function ActionCellBox({ children }: { children?: any }) {
  return <div className={styles.ActionCellBox}>{children}</div>;
}

function ColumnHeader({ field }: { field: TableField }) {
  return <CellBox field={field}>{field.fieldName}</CellBox>;
}

function RowIdx({
  idx,
  dragHandleProps = {},
}: {
  idx?: number;
  dragHandleProps?: any;
}) {
  return (
    <div
      {...dragHandleProps}
      // Don't allow keyboard to TAB into the index
      tabIndex={-1}
      className={styles.RowIdx}
    >
      {idx ?? ""}
    </div>
  );
}

function TableRow({
  tableSchema,
  row,
  rowIdx,
  dragHandleProps,
  validationSchema,
  onEdit,
  onDelete,
}: {
  tableSchema: TableField[];
  row: TRow;
  rowIdx: number;
  dragHandleProps: any;
  validationSchema: any;
  onEdit: (row: TRow, v: { [key: string]: any }) => void;
  onDelete: (rowId: TRow["rowId"]) => void;
}) {
  return (
    <div className={styles.TableRow}>
      <RowIdx idx={rowIdx} dragHandleProps={dragHandleProps} />
      <TableRowFormMemo
        row={row}
        validationSchema={validationSchema}
        tableSchema={tableSchema}
        onEdit={onEdit}
        onDelete={onDelete}
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
          if (shouldSkipField(field)) {
          }
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
        <ActionCellBox></ActionCellBox>
      </div>
    </div>
  );
}

function TableRowForm({
  row,
  tableSchema,
  validationSchema,
  onEdit,
  onDelete,
}: {
  row: TRow;
  tableSchema: TableField[];
  validationSchema: any;
  onDelete: (rowId: TRow["rowId"]) => void;
  onEdit: (row: TRow, v: { [key: string]: any }) => void;
}) {
  return (
    <Formik
      enableReinitialize
      initialValues={row.rowData}
      validationSchema={validationSchema}
      onSubmit={(values, { setSubmitting }) => {
        setSubmitting(false);
      }}
    >
      {(formik) => {
        return (
          <Form onSubmit={formik.handleSubmit} className={styles.TableRowForm}>
            <AutoSubmitter
              formik={formik}
              onAutoSubmit={(v) => onEdit(row, v)}
            />
            <div className={styles.TableRowInner}>
              {tableSchema.map((field, idx) => {
                if (shouldSkipField(field)) {
                  return null;
                }
                return (
                  <TableCell
                    key={field.fieldId}
                    field={field}
                    value={row.rowData[field.fieldId]}
                  />
                );
              })}
              <ActionCellBox>
                <div onClick={() => onDelete(row.rowId)}>
                  <Trash />
                </div>
              </ActionCellBox>
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
