// Adapted from https://react-select.com/creatable
import * as React from "react";
import { useState, useEffect } from "react";

import CreatableSelect from "react-select/creatable";

const components = {
  DropdownIndicator: null,
};

interface Option {
  readonly label: string;
  readonly value: string;
}

const createOption = (label: string) => ({
  label,
  value: label,
});

export default function CustomMultiSelectTextInput({
  onChange,
}: {
  onChange: (value: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const [value, setValue] = useState<Option[]>([]);
  useEffect(() => {
    onChange(value.map((x) => x.value));
  }, [value]);
  return (
    <CreatableSelect
      components={components}
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={(value) => {
        setValue([...value]);
      }}
      onInputChange={(inputValue) => {
        setInputValue(inputValue);
      }}
      onKeyDown={(event) => {
        if (!inputValue) return;
        switch (event.key) {
          case "Enter":
          case "Tab":
            const newValue = createOption(inputValue);
            setValue((value) => [...value, newValue]);
            setInputValue("");
            event.preventDefault();
        }
      }}
      placeholder="Type something and press enter..."
      value={value}
    />
  );
}
