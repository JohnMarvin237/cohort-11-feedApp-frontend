import { type JSX, type TextareaHTMLAttributes } from "react";
import { useField } from "formik";

interface BigTextFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    name: string;
    maxCharacters?: number; // shows a "120/500" counter under the field
}

const BigTextField = ({
    label,
    maxCharacters,
    ...props
}: BigTextFieldProps): JSX.Element => {
    const [field, meta] = useField<string>(props);
    const length: number = field.value?.length ?? 0;

    return (
        <>
            <label
                htmlFor={props.id}
                className="block mb-2 text-sm text-gray-600"
            >
                {label}
            </label>
            <textarea
                {...field}
                {...props}
                className="block w-full resize-none overflow-y-auto px-4 py-2 mt-2 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-md focus:border-purple-400 focus:outline-hidden focus:ring-3 focus:ring-purple-400/40"
            ></textarea>

            <div className="flex justify-between gap-2 mt-1">
                {meta.touched && meta.error ? (
                    <p className="text-red-600 text-xs italic">{meta.error}</p>
                ) : (
                    <span />
                )}
                {maxCharacters !== undefined && (
                    <p
                        className={`text-xs ${length > maxCharacters ? "text-red-600" : "text-gray-400"}`}
                    >
                        {length}/{maxCharacters}
                    </p>
                )}
            </div>
        </>
    );
};

export default BigTextField;
