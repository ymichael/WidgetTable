import * as React from "react";
import { Formik, Form } from "formik";

import { TableField, TRow } from "../shared/types";
import {
  RowFieldEditor,
  generateValidationSchemaFromTableSchema,
} from "./RowEditor";
import { widthForFieldType } from "../shared/utils";
import styles from "./Table.module.css";

export default function Table({
  title,
  tableSchema,
  rows,
}: {
  title: string;
  tableSchema: TableField[];
  rows: TRow[];
}) {
  return (
    <div className={styles.Table}>
      <div className={styles.TableHeader}>
        <RowIdx />
        {tableSchema.map((field) => {
          return <ColumnHeader key={field.fieldId} field={field} />;
        })}
      </div>
      <div>
        {rows.map((row, idx) => {
          return (
            <TableRow
              key={row.rowId}
              rowIdx={idx + 1}
              tableSchema={tableSchema}
              row={row}
            />
          );
        })}
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
