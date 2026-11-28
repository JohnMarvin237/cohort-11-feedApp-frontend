import {
    useState,
    useRef,
    useContext,
    type ChangeEvent,
    type JSX,
} from "react";
import { Formik, Form, type FormikProps } from "formik";
import * as Yup from "yup";
import NoProfileImage from "../assets/images/no-profile.png";
import Badge from "./Badges";
import Field from "./Field";
import BigTextField from "./BigTextField";
import Button from "./Button";
import ImageCropper from "./ImageCropper";
import AiAvatarGenerator from "./AiAvatarGenerator";
import { updatePublicProfileApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";
import {
    ACCEPTED_IMAGE_TYPES,
    MAX_PICTURE_LENGTH,
    convertBase64,
    validateImageFile,
} from "../util/Helper";

interface UpdatePublicProfileProps {
    bio?: string;
    city?: string;
    country?: string;
    headline?: string;
    picture?: string;
}

interface UpdatePublicProfileFormValues {
    bio: string;
    city: string;
    country: string;
    headline: string;
    picture: string;
    formMessage?: string;
}

// Same rules as the "Profile" table of feedAppModel: headline and picture are NOT NULL,
// bio, city and country are optional, and no text column has a length limit.
// MAX_PICTURE_LENGTH is not a database rule, only a safety cap on the request size.
const UpdateBasicProfileSchema = Yup.object().shape({
    headline: Yup.string().trim().required("Required"),
    bio: Yup.string(),
    city: Yup.string(),
    country: Yup.string(),
    picture: Yup.string()
        .max(
            MAX_PICTURE_LENGTH,
            "This picture is too large. Please choose a smaller one.",
        )
        .required("Please upload a profile picture."),
});

const UpdatePublicProfile = ({
    bio = "",
    city = "",
    country = "",
    headline = "",
    picture = "",
}: UpdatePublicProfileProps): JSX.Element => {
    const formikRef = useRef<FormikProps<UpdatePublicProfileFormValues>>(null);
    const imageSelectRef = useRef<HTMLInputElement>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [isAvatarGeneratorOpen, setIsAvatarGeneratorOpen] =
        useState<boolean>(false);
    const [modalIsOpen, setIsOpen] = useState<boolean>(false);
    const [uploadImageData, setUploadImageData] = useState<string | undefined>(
        undefined,
    );
    const [imageSrc, setImageSrc] = useState<string>(picture || NoProfileImage);
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    // The AI avatar replaces the picture of an existing profile (not offered on Complete Profile)
    const userData = appContext?.getUserData();
    const hasProfile: boolean = Boolean(userData?.profile);

    // Called by ImageCropper with the cropped image: show it and store it in the form
    const onImageCropped = (croppedImage: string): void => {
        setImageSrc(croppedImage);
        formikRef.current?.setFieldValue("picture", croppedImage);
    };

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

    // Called by AiAvatarGenerator: the backend has already saved the avatar as the profile picture
    const onAvatarGenerated = (
        avatar: string,
        remainingGenerations: number,
    ): void => {
        // Context: NavBar, MyProfile and the feed cards show the new avatar right away
        if (userData?.profile) {
            appContext?.setUserData({
                ...userData,
                profile: { ...userData.profile, picture: avatar },
            });
        }
        // Also in the form: a later "Save" must keep the new avatar, not send the old picture back
        setImageSrc(avatar);
        formikRef.current?.setFieldValue("picture", avatar);
        formikRef.current?.setFieldValue(
            "formMessage",
            `AI avatar saved. ${remainingGenerations} generation${remainingGenerations === 1 ? "" : "s"} left today.`,
        );
        setIsAvatarGeneratorOpen(false);
    };

    const onFormSubmit = async (
        values: UpdatePublicProfileFormValues,
    ): Promise<void> => {
        // token is always present here: AppRoutes only shows this page to logged-in users
        if (!isFetching && token) {
            setIsFetching(true);

            const apiResponse: StandardResponse = await updatePublicProfileApi(
                token,
                values.bio,
                values.city,
                values.country,
                values.headline,
                values.picture,
            );

            if (apiResponse.status === 1) {
                appContext?.setUserData(apiResponse.payLoad);
                formikRef.current?.setFieldValue(
                    "formMessage",
                    "Public profile saved.",
                );
            } else {
                formikRef.current?.setFieldValue(
                    "formMessage",
                    apiResponse.payLoad,
                );
            }

            setIsFetching(false);
        }
    };

    return (
        <>
            {isAvatarGeneratorOpen && (
                <AiAvatarGenerator
                    closeModal={() => setIsAvatarGeneratorOpen(false)}
                    onAvatarGenerated={onAvatarGenerated}
                />
            )}
            {modalIsOpen && uploadImageData && (
                <ImageCropper
                    modalIsOpen={modalIsOpen}
                    closeModal={closeModal}
                    uploadImageData={uploadImageData}
                    setImageSrc={onImageCropped}
                />
            )}
            <Formik<UpdatePublicProfileFormValues>
                innerRef={formikRef}
                initialValues={{
                    bio,
                    city,
                    country,
                    headline,
                    picture,
                    formMessage: undefined,
                }}
                validationSchema={UpdateBasicProfileSchema}
                onSubmit={onFormSubmit}
            >
                {({ values, errors, touched }) => (
                    <Form className="bg-white shadow rounded-lg mb-6 p-5">
                        <div className="text-gray-600 text-lg font-semibold mt-2 mb-7">
                            Public Profile
                        </div>

                        {values.formMessage && (
                            <div>
                                <Badge text={values.formMessage} />
                            </div>
                        )}

                        <div className="flex flex-col mb-10">
                            <img
                                className="h-36 w-36 bg-white p-2 rounded-full shadow mb-4 mx-auto"
                                src={imageSrc}
                                alt="Profile"
                            />

                            <div className="flex flex-wrap justify-center gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-purple-600 rounded-md hover:bg-purple-400 focus:outline-hidden focus:bg-purple-400 focus:ring-3 focus:ring-purple-300/50"
                                    onClick={() =>
                                        imageSelectRef.current?.click()
                                    }
                                >
                                    Upload Photo
                                </button>

                                {hasProfile && (
                                    <button
                                        type="button"
                                        className="px-4 py-2 tracking-wide text-purple-700 transition-colors duration-200 transform bg-purple-100 rounded-md hover:bg-purple-200 focus:outline-hidden focus:ring-3 focus:ring-purple-300/50"
                                        onClick={() =>
                                            setIsAvatarGeneratorOpen(true)
                                        }
                                    >
                                        ✨ Generate AI Avatar
                                    </button>
                                )}
                            </div>

                            {hasProfile && (
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    No photo you want to share? Describe a
                                    persona and let the AI draw your avatar.
                                </p>
                            )}

                            <input
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={onSelectFile}
                                ref={imageSelectRef}
                                className="hidden"
                            />

                            {errors.picture && touched.picture && (
                                <p className="text-red-600 text-xs italic mt-1 text-center">
                                    {errors.picture}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <BigTextField
                                    label="Headline"
                                    name="headline"
                                    id="headline"
                                    placeholder="Enter a headline"
                                />
                            </div>

                            <div>
                                <BigTextField
                                    label="Bio (optional)"
                                    name="bio"
                                    id="bio"
                                    placeholder="Enter your bio"
                                />
                            </div>

                            <div>
                                <Field
                                    label="City (optional)"
                                    type="text"
                                    name="city"
                                    id="city"
                                    placeholder="Enter your city"
                                />
                            </div>

                            <div>
                                <Field
                                    label="Country (optional)"
                                    type="text"
                                    name="country"
                                    id="country"
                                    placeholder="Enter your country"
                                />
                            </div>
                        </div>

                        <footer className="flex justify-end mt-8">
                            <Button text="Save" fullWidth={false} />
                        </footer>
                    </Form>
                )}
            </Formik>
        </>
    );
};

export default UpdatePublicProfile;
