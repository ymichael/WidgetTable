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
  // private onAutoSubmitDebounced: AutoSubmitterProps["onAutoSubmit"];

  constructor(props: AutoSubmitterProps) {
    super(props);
  }

  componentDidUpdate = debounce(
    (prevProps: AutoSubmitterProps) => {
      if (this.props.formik.isValidating || !this.props.formik.isValid) {
        return;
      }
      if (
        !prevProps.formik.isValidating &&
        prevProps.formik.isValid &&
        isEqual(prevProps.formik.values, this.props.formik.values)
      ) {
        return;
      }
      console.log("onAutoSubmit");
      this.props.onAutoSubmit(this.props.formik.values);
    },
    100,
    { maxWait: 1000 }
  );

  render() {
    return null;
  }
}
