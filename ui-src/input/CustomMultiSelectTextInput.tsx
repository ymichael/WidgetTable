/**
 * An input element that works as a multi-select w/o a dropdown.
 * This is useful for collecting lists of strings.
 *
 * Adapted from https://react-select.com/creatable
 */
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
  initialValue,
  onChange,
}: {
  initialValue: string[];
  onChange: (value: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState<string>("");
  const [value, setValue] = useState<Option[]>(initialValue.map(createOption));
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
          case ",":
            const newValue = createOption(inputValue);
            setValue((value) => [...value, newValue]);
            setInputValue("");
            event.preventDefault();
        }
      }}
      placeholder="Type something and press enter..."
      value={value}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary25: "#e9ccff",
          primary: "#A83FFB",
        },
      })}
    />
  );
}
