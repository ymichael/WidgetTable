import { TRow, TableField, FieldType } from "../shared/types";

export type Template = {
  title: string;
  description: string;
  defaultTitle: string;
  defaultSchema: TableField[];
  defaultRows: TRow["rowData"][];
};

export const DEFAULT_SCHEMA: TableField[] = [
  {
    fieldId: "title",
    fieldName: "Title",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
  {
    fieldId: "description",
    fieldName: "Description",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldId: "completed",
    fieldName: "Completed",
    fieldType: FieldType.CHECKBOX,
  },
];

export const STICKY_SCHEMA: TableField[] = [
  {
    fieldId: "text",
    fieldName: "Sticky Text",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldId: "author",
    fieldName: "Author",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
];

export const STICKY_NO_AUTHOR_SCHEMA: TableField[] = [
  {
    fieldId: "text",
    fieldName: "Sticky Text",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
];

export const TEMPLATES: Template[] = [
  {
    title: "Task Management",
    defaultTitle: "Tasks",
    description: "Tasks, priorities and completion status",
    defaultSchema: [
      {
        fieldId: "title",
        fieldName: "Title",
        fieldType: FieldType.TEXT_SINGLE_LINE,
      },
      {
        fieldId: "description",
        fieldName: "Description",
        fieldType: FieldType.TEXT_MULTI_LINE,
      },
      {
        fieldId: "priority",
        fieldName: "Priority",
        fieldType: FieldType.SELECT_SINGLE,
        fieldOptions: ["P0", "P1", "P2"],
      },
      {
        fieldId: "completed",
        fieldName: "Completed",
        fieldType: FieldType.CHECKBOX,
      },
    ],
    defaultRows: [
      {
        title: "Create task list",
        description: "Figure out what is important and their priorities.",
        priority: "P0",
        completed: true,
      },
      {
        title: "Make dinner reservation for wife's birthday",
        description: "Sushi? Maybe that place we go all the time.",
        priority: "P1",
        completed: false,
      },
      {
        title: "Make it pop",
        description: "I'm not sure what this means but tracking here.",
        priority: "P2",
        completed: false,
      },
    ],
  },
  {
    title: "Poll / Voting",
    description: "Collect +1s on each row, great for Q&A and ad-hoc polls",
    defaultTitle: "Questions",
    defaultSchema: [
      {
        fieldId: "question",
        fieldName: "Question",
        fieldType: FieldType.TEXT_MULTI_LINE,
      },
      {
        fieldId: "answered",
        fieldName: "Answered",
        fieldType: FieldType.CHECKBOX,
      },
      {
        fieldId: "+1",
        fieldName: "+1",
        fieldType: FieldType.VOTE,
      },
    ],
    defaultRows: [
      { question: "When is the holiday party?" },
      { question: "Who is your favorite BTS member?" },
      { question: "What did you think of the 10min version of All Too Well?" },
    ],
  },
  {
    title: "Shopping/Inventory List",
    description: "Item, description, quanty & price",
    defaultTitle: "Shopping List",
    defaultSchema: [
      {
        fieldId: "item",
        fieldName: "Item name",
        fieldType: FieldType.TEXT_SINGLE_LINE,
      },
      {
        fieldId: "description",
        fieldName: "Description",
        fieldType: FieldType.TEXT_MULTI_LINE,
      },
      {
        fieldId: "quantity",
        fieldName: "Quantity",
        fieldType: FieldType.NUMBER,
        fieldSuffix: "",
        fieldPrefix: "",
      },
      {
        fieldId: "price",
        fieldName: "Price",
        fieldType: FieldType.NUMBER,
        fieldSuffix: "",
        fieldPrefix: "$",
      },
    ],
    defaultRows: [
      {
        item: "Thin Spaghetti",
        description: "Linguini or fettuccine is okay too",
        quantity: 1,
        price: 2,
      },
      {
        item: "Tomatoes",
        description: "Hot house is possible, roma is fine too.",
        quantity: 3,
        price: 1,
      },
      {
        item: "Yellow Onions",
        description: "If you have to have the whole bag, that's fine too.",
        quantity: 2,
        price: "0.50",
      },
      {
        item: "Garlic",
        description: "A whole clove is more than enough",
        quantity: 1,
        price: 1,
      },
      {
        item: "Olive Oil",
        description:
          "Italian, extra virgin but ok to substitute with what is available.",
        quantity: 1,
        price: 10,
      },
    ],
  },
  {
    title: "Contact List / CRM",
    description: "Name, pronouns, company, email",
    defaultTitle: "Customers",
    defaultSchema: [
      {
        fieldId: "name",
        fieldName: "Contact Name",
        fieldType: FieldType.TEXT_SINGLE_LINE,
      },
      {
        fieldId: "pronouns",
        fieldName: "Pronouns",
        fieldType: FieldType.TEXT_SINGLE_LINE,
      },
      {
        fieldId: "company",
        fieldName: "Company",
        fieldType: FieldType.TEXT_SINGLE_LINE,
      },
      {
        fieldId: "email",
        fieldName: "Email",
        fieldType: FieldType.EMAIL,
      },
      {
        fieldId: "notes",
        fieldName: "Notes",
        fieldType: FieldType.TEXT_MULTI_LINE,
      },
    ],
    defaultRows: [
      {
        name: "Thomas Hines",
        pronouns: "He/Him",
        company: "Acme Co.",
        email: "thines@acme.com",
      },
      {
        name: "Colleen Lawrence",
        pronouns: "She/Her",
        company: "Acme Co.",
        email: "clawrence@acme.com",
      },
      {
        name: "Kara Hansen",
        pronouns: "They/Them",
        company: "Acme Co.",
        email: "khansen@acme.com",
      },
    ],
  },
];
