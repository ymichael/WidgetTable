import * as React from "react";
import { debounce, isEqual } from "lodash";

type AutoSubmitterProps = {
  formik: {
    values: any;
    validateForm: Function;
    isValid: boolean;
  };
  onAutoSubmit: (v: any) => void;
};

export default class AutoSubmitter extends React.Component<AutoSubmitterProps> {
  private onAutoSubmitDebounced: AutoSubmitterProps["onAutoSubmit"];

  constructor(props: AutoSubmitterProps) {
    super(props);
    this.onAutoSubmitDebounced = debounce(props.onAutoSubmit);
  }

  componentDidUpdate(prevProps: AutoSubmitterProps) {
    if (!this.props.formik.isValid) {
      return;
    }
    if (
      prevProps.formik.isValid &&
      isEqual(prevProps.formik.values, this.props.formik.values)
    ) {
      return;
    }
    this.onAutoSubmitDebounced(this.props.formik.values);
  }

  render() {
    return null;
  }
}
