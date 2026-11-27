import { useState, useContext, type JSX } from "react";
import { Formik, Form, type FormikHelpers } from "formik";
import * as Yup from "yup";
import Badge from "./Badges";
import Field from "./Field";
import Button from "./Button";

import { updateBasicProfileApi, type StandardResponse } from "../util/ApiUtil";
import { AppContext } from "../context/applicationContext";

// No password prop: the frontend never knows the user's password
interface UpdateBasicProfileProps {
    emailId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

interface UpdateBasicProfileFormValues {
    firstName: string;
    lastName: string;
    phone: string;
    emailId: string;
    password: string; // "" = keep the current password
    formMessage?: string;
}

// Same rules as the Register page
const UpdateBasicProfileSchema = Yup.object().shape({
    firstName: Yup.string().trim().required("Required"),
    lastName: Yup.string().trim().required("Required"),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
        .required("Required"),
    emailId: Yup.string().email("Invalid email").required("Required"),
    // Optional: checked only when the user types a new password
    password: Yup.string().matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
        {
            message:
                "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character",
            excludeEmptyString: true,
        },
    ),
});

const UpdateBasicProfile = ({
    emailId = "",
    firstName = "",
    lastName = "",
    phone = "",
}: UpdateBasicProfileProps): JSX.Element => {
    const [isFetching, setIsFetching] = useState<boolean>(false);

    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;

    const onFormSubmit = async (
        values: UpdateBasicProfileFormValues,
        {
            resetForm,
            setFieldValue,
        }: FormikHelpers<UpdateBasicProfileFormValues>,
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

        const savedValues = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            phone: values.phone,
            emailId: values.emailId.trim(),
        };

        const apiResponse: StandardResponse = await updateBasicProfileApi(
            token,
            values.password || undefined, // empty: not sent, the current password is kept
            savedValues.emailId,
            savedValues.firstName,
            savedValues.lastName,
            savedValues.phone,
        );

        if (apiResponse.status === 1) {
            appContext?.setUserData(apiResponse.payLoad);
            // The saved values become the new starting point, and the password never stays in the form
            resetForm({
                values: {
                    ...savedValues,
                    password: "",
                    formMessage: "Basic profile saved.",
                },
            });
        } else {
            setFieldValue("formMessage", apiResponse.payLoad);
        }

        setIsFetching(false);
    };

    return (
        <Formik<UpdateBasicProfileFormValues>
            initialValues={{
                firstName,
                lastName,
                phone,
                emailId,
                password: "",
                formMessage: undefined,
            }}
            validationSchema={UpdateBasicProfileSchema}
            onSubmit={onFormSubmit}
        >
            {({ values }) => (
                <Form className="bg-white shadow rounded-lg mb-6 p-5">
                    <div className="text-gray-600 text-lg font-semibold mt-2 mb-7">
                        Basic Profile
                    </div>

                    {values.formMessage && (
                        <div>
                            <Badge text={values.formMessage} />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Field
                                label="First Name"
                                type="text"
                                name="firstName"
                                id="firstName"
                                autoComplete="given-name"
                                placeholder="Enter your first name"
                            />
                        </div>
                        <div>
                            <Field
                                label="Last Name"
                                type="text"
                                name="lastName"
                                id="lastName"
                                autoComplete="family-name"
                                placeholder="Enter your last name"
                            />
                        </div>

                        <div>
                            <Field
                                label="Email"
                                type="text"
                                name="emailId"
                                id="emailId"
                                autoComplete="email"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <Field
                                label="New Password (optional)"
                                type="password"
                                name="password"
                                id="password"
                                autoComplete="new-password"
                                placeholder="Leave empty to keep your password"
                            />
                        </div>
                        <div>
                            <Field
                                label="Phone"
                                type="text"
                                name="phone"
                                id="phone"
                                autoComplete="tel"
                                placeholder="Enter your phone"
                            />
                        </div>
                    </div>

                    <footer className="flex justify-end mt-8">
                        <Button text="Save" fullWidth={false} />
                    </footer>
                </Form>
            )}
        </Formik>
    );
};

export default UpdateBasicProfile;
