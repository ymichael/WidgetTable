import * as React from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";

import {
  Table,
  FieldType,
  TableField,
  WidgetToIFrameMessage,
} from "../shared/types";

const TEST_TABLE: TableField[] = [
  { fieldName: "Title", fieldType: FieldType.TEXT_SINGLE_LINE },
  { fieldName: "Description", fieldType: FieldType.TEXT_MULTI_LINE },
  { fieldName: "Published", fieldType: FieldType.CHECKBOX },
  {
    fieldName: "Status",
    fieldType: FieldType.SELECT_SINGLE,
    fieldOptions: ["Draft", "In Review", "Ready"],
  },
  {
    fieldName: "Tags",
    fieldType: FieldType.SELECT_MULTIPLE,
    fieldOptions: ["Eng", "Design", "Data", "General"],
  },
];

const TEST_DATA = {
  Title: "Hello Widgets",
  Published: true,
};

const widgetPayload: WidgetToIFrameMessage | undefined = (window as any)
  .widgetPayload;
const showSchemaEditor = !!widgetPayload
  ? widgetPayload.type === "EDIT_SCHEMA"
  : /schema=1/.test(window.location.search);

const schema: Pick<Table, "fields"> =
  widgetPayload?.type === "EDIT_SCHEMA"
    ? widgetPayload.table
    : {
        fields: [
          {
            fieldName: "Title",
            fieldType: FieldType.TEXT_SINGLE_LINE,
          },
          {
            fieldName: "Description",
            fieldType: FieldType.TEXT_MULTI_LINE,
          },
        ],
      };

function App() {
  return (
    <div className={styles.App}>
      {showSchemaEditor ? (
        <SchemaEditor initialValues={schema} />
      ) : (
        <RowEditor tableSchema={TEST_TABLE} initialValues={TEST_DATA} />
      )}
    </div>
  );
}

export default App;
