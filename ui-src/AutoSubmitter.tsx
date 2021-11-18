import * as React from "react";
import { debounce, isEqual } from "lodash";

type AutoSubmitterProps = {
  formik: {
    values: any;
    validateForm: Function;
    isValid: boolean;
    isValidating: boolean;
  };
  onAutoSubmit: (v: any) => void;
};

export default class AutoSubmitter extends React.Component<AutoSubmitterProps> {
  private lastSubmittedValues: any;

  constructor(props: AutoSubmitterProps) {
    super(props);
    this.lastSubmittedValues = props.formik.values || null;
  }

  componentDidUpdate = debounce(
    (prevProps: AutoSubmitterProps) => {
      if (this.props.formik.isValidating || !this.props.formik.isValid) {
        return;
      }
      if (isEqual(this.lastSubmittedValues, this.props.formik.values)) {
        return;
      }
      this.lastSubmittedValues = this.props.formik.values;
      this.props.onAutoSubmit(this.lastSubmittedValues);
    },
    200,
    { maxWait: 1000 }
  );

  render() {
    return null;
  }
}
