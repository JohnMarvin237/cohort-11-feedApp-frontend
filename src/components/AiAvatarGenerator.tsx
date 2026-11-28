import { useContext, useEffect, useState, type JSX } from "react";
import Modal from "react-modal";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import BigTextField from "./BigTextField";
import { generateAiAvatarApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";

const MAX_PROMPT_LENGTH = 300; // same limit as the backend

interface AiAvatarGeneratorProps {
    closeModal: () => void;
    // Called once the backend has generated AND saved the avatar
    onAvatarGenerated: (picture: string, remainingGenerations: number) => void;
}

interface GeneratorFormValues {
    prompt: string;
}

const GeneratorSchema: Yup.ObjectSchema<GeneratorFormValues> =
    Yup.object().shape({
        prompt: Yup.string()
            .trim()
            .max(MAX_PROMPT_LENGTH, `At most ${MAX_PROMPT_LENGTH} characters.`)
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
    onAvatarGenerated,
}: AiAvatarGeneratorProps): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Generation takes 10 to 40 seconds: show the time passing, so the user knows it is still working
    useEffect((): (() => void) | undefined => {
        if (!isGenerating) return undefined;
        const timer = setInterval(
            () => setSecondsElapsed((seconds) => seconds + 1),
            1000,
        );
        return () => clearInterval(timer);
    }, [isGenerating]);

    const generate = async (values: GeneratorFormValues): Promise<void> => {
        if (isGenerating || !token) return;

        setSecondsElapsed(0);
        setIsGenerating(true);
        setErrorMessage(null);

        const apiResponse: StandardResponse = await generateAiAvatarApi(
            token,
            values.prompt.trim(),
        );

        setIsGenerating(false);

        if (apiResponse.status === 1) {
            onAvatarGenerated(
                apiResponse.payLoad.picture,
                apiResponse.payLoad.remainingGenerations ?? 0,
            );
        } else {
            setErrorMessage(apiResponse.payLoad);
        }
    };

    return (
        <Modal
            isOpen
            // No closing by clicking outside while the image is being generated
            onRequestClose={isGenerating ? undefined : closeModal}
            style={customStyles}
            contentLabel="Generate an AI avatar"
        >
            <div className="bg-white shadow rounded-lg p-5 w-[90vw] max-w-md">
                <div className="text-gray-600 text-lg font-semibold mt-2 mb-2">
                    Generate an AI Avatar
                </div>
                <p className="text-sm text-gray-500 mb-5">
                    No real photo needed: describe a persona and the AI draws it
                    in the Feed App style. It becomes your profile picture right
                    away.
                </p>

                <Formik<GeneratorFormValues>
                    initialValues={{ prompt: "" }}
                    validationSchema={GeneratorSchema}
                    onSubmit={generate}
                >
                    <Form>
                        <BigTextField
                            label="Describe your avatar"
                            name="prompt"
                            id="avatarPrompt"
                            placeholder="e.g. A robotic owl wearing glasses"
                            maxCharacters={MAX_PROMPT_LENGTH}
                            disabled={isGenerating}
                        />

                        {isGenerating && (
                            <p
                                className="mt-4 text-sm text-gray-500"
                                role="status"
                            >
                                Generating your avatar... {secondsElapsed}s (it
                                can take up to a minute)
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
                                disabled={isGenerating}
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className={primaryButton}
                                disabled={isGenerating}
                            >
                                {isGenerating ? "Generating..." : "Generate"}
                            </button>
                        </footer>
                    </Form>
                </Formik>
            </div>
        </Modal>
    );
};

export default AiAvatarGenerator;
