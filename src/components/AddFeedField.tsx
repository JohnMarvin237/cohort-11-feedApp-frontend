import { type JSX, type TextareaHTMLAttributes } from "react";
import { useField } from "formik";

interface AddFeedFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  name: string;
}

const AddFeedField = ({ label, ...props }: AddFeedFieldProps): JSX.Element => {
  const [field, meta] = useField<string>(props);

  return (
    <>
      {label && (
        <label htmlFor={props.id} className="block mb-2 text-sm text-gray-600">
          {label}
        </label>
      )}
      <textarea
        {...field}
        {...props}
        className="w-full rounded-lg p-2 text-sm bg-gray-100 border border-transparent appearance-none placeholder-gray-400"
      ></textarea>

      {meta.touched && meta.error ? (
        <p className="text-red-600 text-xs italic mt-1">{meta.error}</p>
      ) : null}
    </>
  );
};

export default AddFeedField;