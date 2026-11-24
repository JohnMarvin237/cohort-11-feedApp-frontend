import { type JSX, type InputHTMLAttributes } from "react";
import { useField } from "formik";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

const Field = ({ label, ...props }: FieldProps): JSX.Element => {
    const [field, meta] = useField<string>(props);
    
    return <>
        <label className="block mb-2 text-sm text-gray-600">{label}</label>
        <input
        {...field}
        {...props}
       className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-md focus:border-purple-400 focus:outline-hidden focus:ring-3 focus:ring-purple-400/40"
        />
        {meta.touched && meta.error ? (
        <p className="text-red-600 text-xs italic mt-1">{meta.error}</p>
  ) : null}  
    </>;
};

export default Field;