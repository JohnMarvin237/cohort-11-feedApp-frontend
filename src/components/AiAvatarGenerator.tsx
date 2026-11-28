import {
    useContext,
    useRef,
    useState,
    type ChangeEvent,
    type JSX,
} from "react";
import Modal from "react-modal";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import BigTextField from "./BigTextField";
import { generateAiAvatarApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";
import {
    ACCEPTED_IMAGE_TYPES,
    convertBase64,
    dataUrlToBlob,
    resizeImage,
    validateImageFile,
} from "../util/Helper";

const MAX_DESCRIPTION_LENGTH = 500; // same limit as the backend
const STARTING_PHOTO_MAX_SIDE = 1024; // pixels: enough for the AI to see the face, small to send

interface AiAvatarGeneratorProps {
    closeModal: () => void;
    // Saves the chosen avatar; returns an error message, or null when it was saved
    onAvatarChosen: (picture: string) => Promise<string | null>;
}

interface GeneratorFormValues {
    description: string;
}

const GeneratorSchema: Yup.ObjectSchema<GeneratorFormValues> =
    Yup.object().shape({
        description: Yup.string()
            .trim()
            .max(
                MAX_DESCRIPTION_LENGTH,
                `At most ${MAX_DESCRIPTION_LENGTH} characters.`,
            )
            .required("Describe the avatar you want."),
    });

const customStyles: Modal.Styles = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        border: "none",
        padding: 0,
        backgroundColor: "transparent",
    },
};

const primaryButton =
    "px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-purple-600 rounded-md hover:bg-purple-400 focus:outline-hidden focus:ring-3 focus:ring-purple-300/50 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButton =
    "px-4 py-2 tracking-wide text-gray-700 transition-colors duration-200 transform bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-hidden focus:ring-3 focus:ring-purple-300/50 disabled:opacity-50 disabled:cursor-not-allowed";

const AiAvatarGenerator = ({
    closeModal,
    onAvatarChosen,
}: AiAvatarGeneratorProps): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    const photoSelectRef = useRef<HTMLInputElement>(null);

    const [startingPhoto, setStartingPhoto] = useState<string | null>(null);
    const [isPreparingPhoto, setIsPreparingPhoto] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isBusy: boolean = isPreparingPhoto || isGenerating || isSaving;

    const onSelectPhoto = async (
        e: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const input = e.target;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        input.value = ""; // lets the user pick the same file again

        const fileError = validateImageFile(file);
        setErrorMessage(fileError);
        if (fileError) return;

        setIsPreparingPhoto(true);
        try {
            // Whole photo kept (no cropping), only resized and compressed before being sent
            setStartingPhoto(
                await resizeImage(
                    await convertBase64(file),
                    STARTING_PHOTO_MAX_SIDE,
                    STARTING_PHOTO_MAX_SIDE,
                ),
            );
        } catch {
            setErrorMessage(
                "This image could not be read. Please choose another one.",
            );
        } finally {
            setIsPreparingPhoto(false);
        }
    };

    const generate = async (values: GeneratorFormValues): Promise<void> => {
        if (isBusy || !token) return;

        setIsGenerating(true);
        setErrorMessage(null);

        const apiResponse: StandardResponse = await generateAiAvatarApi(
            token,
            values.description.trim(),
            startingPhoto ? dataUrlToBlob(startingPhoto) : null,
        );

        if (apiResponse.status === 1) {
            setGeneratedAvatar(apiResponse.payLoad);
        } else {
            setErrorMessage(apiResponse.payLoad);
        }

        setIsGenerating(false);
    };

    const chooseAvatar = async (): Promise<void> => {
        if (!generatedAvatar || isBusy) return;

        setIsSaving(true);
        setErrorMessage(null);

        // On success the parent closes this modal; on failure the message is shown here
        const error = await onAvatarChosen(generatedAvatar);
        if (error) {
            setErrorMessage(error);
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen
            onRequestClose={closeModal}
            style={customStyles}
            contentLabel="Generate an AI avatar"
        >
            <div className="bg-white shadow rounded-lg p-5 w-[90vw] max-w-md">
                <div className="text-gray-600 text-lg font-semibold mt-2 mb-5">
                    Generate an AI Avatar
                </div>

                {generatedAvatar && (
                    <div className="flex flex-col items-center mb-5">
                        <img
                            className="h-40 w-40 bg-white p-2 rounded-full shadow mb-3"
                            src={generatedAvatar}
                            alt="Generated avatar"
                        />
                        <button
                            type="button"
                            className={primaryButton}
                            disabled={isBusy}
                            onClick={chooseAvatar}
                        >
                            {isSaving ? "Saving..." : "Use this avatar"}
                        </button>
                    </div>
                )}

                <Formik<GeneratorFormValues>
                    initialValues={{ description: "" }}
                    validationSchema={GeneratorSchema}
                    onSubmit={generate}
                >
                    <Form>
                        <BigTextField
                            label="Describe your avatar"
                            name="description"
                            id="avatarDescription"
                            placeholder="e.g. A friendly cartoon developer with curly hair and glasses, purple background"
                            maxCharacters={MAX_DESCRIPTION_LENGTH}
                        />

                        <div className="mt-4">
                            {startingPhoto ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            className="h-16 w-16 object-cover rounded-md shadow"
                                            src={startingPhoto}
                                            alt="Starting photo"
                                        />
                                        <button
                                            type="button"
                                            aria-label="Remove the starting photo"
                                            disabled={isBusy}
                                            className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-white text-sm shadow hover:bg-gray-800"
                                            onClick={(): void =>
                                                setStartingPhoto(null)
                                            }
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        The avatar will look like the person in
                                        this photo.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className="text-sm font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50"
                                    onClick={(): void =>
                                        photoSelectRef.current?.click()
                                    }
                                >
                                    {isPreparingPhoto
                                        ? "Preparing the photo..."
                                        : "+ Add a starting photo (optional)"}
                                </button>
                            )}
                            <p className="mt-1 text-xs text-gray-400">
                                Your description and photo are sent to OpenAI to
                                create the avatar. The photo is not saved.
                            </p>
                            <input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={onSelectPhoto}
                                ref={photoSelectRef}
                                className="hidden"
                                aria-label="Starting photo file"
                            />
                        </div>

                        {isGenerating && (
                            <p
                                className="mt-4 text-sm text-gray-500"
                                role="status"
                            >
                                Generating your avatar... this can take up to a
                                minute.
                            </p>
                        )}
                        {errorMessage && (
                            <p className="mt-4 text-red-600 text-xs italic">
                                {errorMessage}
                            </p>
                        )}

                        <footer className="flex justify-end mt-6 gap-2">
                            <button
                                type="button"
                                className={secondaryButton}
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={primaryButton}
                                disabled={isBusy}
                            >
                                {generatedAvatar
                                    ? "Generate again"
                                    : "Generate"}
                            </button>
                        </footer>
                    </Form>
                </Formik>
            </div>
        </Modal>
    );
};

export default AiAvatarGenerator;
