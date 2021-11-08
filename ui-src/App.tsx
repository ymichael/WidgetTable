import * as React from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";

import { FieldType, TableField } from "../shared/types";

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

const showSchemaEditor = /schema=1/.test(window.location.search);
const showRowDataForm = !showSchemaEditor;

function App() {
  return (
    <div className={styles.App}>
      {showSchemaEditor && <SchemaEditor />}
      {showRowDataForm && (
        <RowEditor tableSchema={TEST_TABLE} initialValues={TEST_DATA} />
      )}
    </div>
  );
}

export default App;
