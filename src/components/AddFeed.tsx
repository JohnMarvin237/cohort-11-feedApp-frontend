import {
    useContext,
    useRef,
    useState,
    type ChangeEvent,
    type JSX,
} from "react";
import { Formik, Form, type FormikHelpers, type FormikProps } from "formik";
import * as Yup from "yup";
import Badge from "./Badges";
import AddFeedField from "./AddFeedField";
import ImageCropper from "./ImageCropper";

import { addFeedApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";
import {
    ACCEPTED_IMAGE_TYPES,
    MAX_PICTURE_LENGTH,
    convertBase64,
    validateImageFile,
} from "../util/Helper";

// Same limit as Feed.content on the backend (@Size(max = 300))
const MAX_CONTENT_LENGTH = 300;

interface AddFeedFormValues {
    content: string;
    picture: string; // "" = no picture (the picture is optional)
    formMessage?: string;
}

const initialFormValues: AddFeedFormValues = {
    content: "",
    picture: "",
    formMessage: "",
};

const AddFeedSchema: Yup.ObjectSchema<{
    content: string;
    picture: string | undefined;
}> = Yup.object().shape({
    content: Yup.string()
        .trim()
        .max(MAX_CONTENT_LENGTH, `Maximum ${MAX_CONTENT_LENGTH} characters`)
        .required("Your feed cannot be empty."),
    picture: Yup.string().max(
        MAX_PICTURE_LENGTH,
        "This picture is too large. Please choose a smaller one.",
    ),
});

const AddFeed = (): JSX.Element => {
    const formikRef = useRef<FormikProps<AddFeedFormValues>>(null);
    const imageSelectRef = useRef<HTMLInputElement>(null);

    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [modalIsOpen, setIsOpen] = useState<boolean>(false);
    const [uploadImageData, setUploadImageData] = useState<string | undefined>(
        undefined,
    );

    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;

    // The cropped picture goes straight into Formik: the form is the single source of truth
    const onImageCropped = (src: string): void => {
        formikRef.current?.setFieldValue("picture", src);
    };

    // Crop and Cancel both close the modal: closing must never erase the picture already chosen
    const closeModal = (): void => {
        setUploadImageData(undefined);
        setIsOpen(false);
    };

    const onSelectFile = async (
        e: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const input = e.target;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            input.value = ""; // lets the user pick the same file again

            // "accept" is only a hint for the file picker: always check the file itself
            const fileError = validateImageFile(file);
            formikRef.current?.setFieldValue(
                "formMessage",
                fileError ?? undefined,
            );
            if (fileError) return;

            const base64 = await convertBase64(file);
            setUploadImageData(base64);
            setIsOpen(true);
        }
    };

    const onFormSubmit = async (
        values: AddFeedFormValues,
        { resetForm, setFieldValue }: FormikHelpers<AddFeedFormValues>,
    ): Promise<void> => {
        if (isFetching) return;

        if (!token) {
            setFieldValue(
                "formMessage",
                "Your session has expired. Please log in again.",
            );
            return;
        }

        setIsFetching(true);

        const apiResponse: StandardResponse = await addFeedApi(
            token,
            values.content.trim(),
            values.picture || null,
        );

        if (apiResponse.status === 1) {
            // resetForm also clears "touched": no red "required" error right after a successful post
            resetForm({
                values: {
                    ...initialFormValues,
                    formMessage: "Feed has been added.",
                },
            });
        } else {
            setFieldValue("formMessage", apiResponse.payLoad);
        }

        setIsFetching(false);
    };

    return (
        <>
            {modalIsOpen && uploadImageData && (
                <ImageCropper
                    modalIsOpen={modalIsOpen}
                    closeModal={closeModal}
                    uploadImageData={uploadImageData}
                    setImageSrc={onImageCropped}
                />
            )}

            <Formik<AddFeedFormValues>
                innerRef={formikRef}
                initialValues={initialFormValues}
                validationSchema={AddFeedSchema}
                onSubmit={onFormSubmit}
            >
                {({ values, errors, setFieldValue }) => (
                    <Form className="bg-white shadow rounded-lg mb-6 p-4">
                        {values.formMessage && (
                            <div>
                                <Badge text={values.formMessage} />
                            </div>
                        )}

                        {values.picture && (
                            <div className="relative inline-block mb-4">
                                <img
                                    className="h-36 w-36 bg-white p-1 rounded-md shadow"
                                    src={values.picture}
                                    alt="Preview of the picture to publish"
                                />
                                <button
                                    type="button"
                                    aria-label="Remove the picture"
                                    className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-white text-sm shadow hover:bg-gray-800"
                                    onClick={(): void => {
                                        setFieldValue("picture", "");
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        <AddFeedField
                            name="content"
                            id="content"
                            placeholder="Type something..."
                            aria-label="Feed content"
                        />

                        {errors.picture && (
                            <p className="text-red-600 text-xs italic mt-1">
                                {errors.picture}
                            </p>
                        )}

                        <input
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            onChange={onSelectFile}
                            ref={imageSelectRef}
                            className="hidden"
                        />

                        <footer className="flex justify-between mt-2">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    aria-label="Add a picture"
                                    className="flex items-center transition ease-out duration-300 hover:bg-purple-500 hover:text-white bg-purple-100 w-8 h-8 px-2 rounded-full text-purple-400 cursor-pointer"
                                    onClick={(): void => {
                                        imageSelectRef.current?.click();
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        width="24"
                                        height="24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="3"
                                            y="3"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <circle
                                            cx="8.5"
                                            cy="8.5"
                                            r="1.5"
                                        ></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={isFetching}
                                className="flex items-center py-2 px-4 rounded-lg text-sm bg-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                                <svg
                                    className="ml-1"
                                    viewBox="0 0 24 24"
                                    width="16"
                                    height="16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </footer>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default AddFeed;
