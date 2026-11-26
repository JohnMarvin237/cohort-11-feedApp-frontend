import { useState, useRef, useContext, type ChangeEvent, type JSX } from "react";
import { Formik, Form, type FormikProps } from "formik";
import * as Yup from "yup";
import NoProfileImage from "../assets/images/no-profile.png";
import Badge from "./Badges";
import Field from "./Field";
import BigTextField from "./BigTextField";
import Button from "./Button";
import ImageCropper from "./ImageCropper";
import { updatePublicProfileApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PICTURE_LENGTH,
  convertBase64,
  validateImageFile,
} from "../util/Helper";

// Same lengths as the "Profile" columns in the database
const MAX_TEXT_LENGTH = 100;

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

const UpdateBasicProfileSchema = Yup.object().shape({
  bio: Yup.string().max(MAX_TEXT_LENGTH, `Maximum ${MAX_TEXT_LENGTH} characters`).required("Required"),
  city: Yup.string().max(MAX_TEXT_LENGTH, `Maximum ${MAX_TEXT_LENGTH} characters`).required("Required"),
  country: Yup.string().max(MAX_TEXT_LENGTH, `Maximum ${MAX_TEXT_LENGTH} characters`).required("Required"),
  headline: Yup.string().max(MAX_TEXT_LENGTH, `Maximum ${MAX_TEXT_LENGTH} characters`).required("Required"),
  picture: Yup.string()
    .max(MAX_PICTURE_LENGTH, "This picture is too large. Please choose a smaller one.")
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
  const [modalIsOpen, setIsOpen] = useState<boolean>(false);
  const [uploadImageData, setUploadImageData] = useState<string | undefined>(undefined);
  const [imageSrc, setImageSrc] = useState<string>(picture || NoProfileImage);
  const appContext = useContext(AppContext);
  const token: string | null = appContext?.getSession() ?? null;

  // Called by ImageCropper with the cropped image: show it and store it in the form
  const onImageCropped = (croppedImage: string): void => {
    setImageSrc(croppedImage);
    formikRef.current?.setFieldValue("picture", croppedImage);
  };

  const closeModal = (): void => {
    setUploadImageData(undefined);
    setIsOpen(false);
  };

  const onSelectFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = e.target;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      input.value = ""; // lets the user pick the same file again

      // "accept" is only a hint for the file picker: always check the file itself
      const fileError = validateImageFile(file);
      formikRef.current?.setFieldValue("formMessage", fileError ?? undefined);
      if (fileError) return;

      const base64 = await convertBase64(file);
      setUploadImageData(base64);
      setIsOpen(true);
    }
  };

  const onFormSubmit = async (values: UpdatePublicProfileFormValues): Promise<void> => {
    // token is always present here: AppRoutes only shows this page to logged-in users
    if (!isFetching && token) {
      setIsFetching(true);

      const apiResponse: StandardResponse = await updatePublicProfileApi(
        token,
        values.bio,
        values.city,
        values.country,
        values.headline,
        values.picture
      );

      if (apiResponse.status === 1) {
        appContext?.setUserData(apiResponse.payLoad);
        formikRef.current?.setFieldValue("formMessage", "Public profile saved.");
      } else {
        formikRef.current?.setFieldValue("formMessage", apiResponse.payLoad);
      }

      setIsFetching(false);
    }
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
            <div className="text-gray-600 text-lg font-semibold mt-2 mb-7">Public Profile</div>

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

              <button
                type="button"
                className="mx-auto px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-purple-600 rounded-md hover:bg-purple-400 focus:outline-hidden focus:bg-purple-400 focus:ring-3 focus:ring-purple-300/50"
                onClick={() => imageSelectRef.current?.click()}
              >
                Upload Photo
              </button>

              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={onSelectFile}
                ref={imageSelectRef}
                className="hidden"
              />

              {errors.picture && touched.picture && (
                <p className="text-red-600 text-xs italic mt-1 text-center">{errors.picture}</p>
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
                <BigTextField label="Bio" name="bio" id="bio" placeholder="Enter your bio" />
              </div>

              <div>
                <Field
                  label="City"
                  type="text"
                  name="city"
                  id="city"
                  placeholder="Enter your city"
                />
              </div>

              <div>
                <Field
                  label="Country"
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