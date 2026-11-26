import { useEffect, useRef, useState, type JSX } from "react";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, type FormikProps } from "formik";
import Field from "../../components/Field";
import Button from "../../components/Button";
import Badge from "../../components/Badges";
import LogoImage from "../../assets/images/logo.png";

import { registerApi } from "../../util/ApiUtil";

// Time left to read the success message before going to the login page
const REDIRECT_DELAY_SECONDS = 5;

interface RegisterFormValues {
    username: string;
    emailId: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    formMessage?: string;
}

const RegisterSchema = Yup.object().shape({
    firstName: Yup.string().required("Required"),
    lastName: Yup.string().required("Required"),
    username: Yup.string().required("Required"),
    phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
        .required("Required"),
    emailId: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string()
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
            "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character",
        )
        .required("Required"),
});

const Register = (): JSX.Element => {
    const formikRef = useRef<FormikProps<RegisterFormValues>>(null);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    // null = not registered yet; a number = seconds left before the redirect
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect((): void => {
        document.title = "Register | Feed App";
    }, []);

    // Countdown after a successful registration, then redirect to the login page.
    // The cleanup cancels the timer if the user leaves the page first (e.g. "Go to login now").
    useEffect((): (() => void) | undefined => {
        if (secondsLeft === null) return undefined;

        if (secondsLeft === 0) {
            navigate("/user/login", { replace: true });
            return undefined;
        }

        const timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft, navigate]);

    const onFormSubmit = async (values: RegisterFormValues): Promise<void> => {
        // secondsLeft !== null: already registered, the redirect is on its way
        if (!isFetching && secondsLeft === null) {
            setIsFetching(true);

            const apiResponse = await registerApi(
                values.username,
                values.password,
                values.emailId,
                values.firstName,
                values.lastName,
                values.phone,
            );

            setIsFetching(false);

            if (apiResponse.status === 1) {
                formikRef.current?.setFieldValue(
                    "formMessage",
                    "Registration successful. Please check your email to verify your account.",
                );
                setSecondsLeft(REDIRECT_DELAY_SECONDS);
            } else {
                formikRef.current?.setFieldValue(
                    "formMessage",
                    apiResponse.payLoad,
                );
            }
        }
    };

    return (
        <div className="bg-white">
            <div className="flex justify-center h-screen">
                {/* Left Column: Visual Splash - Hidden on mobile, covers 2/3 of screen on large displays */}
                <div className="hidden bg-cover lg:block lg:w-2/3 splash-container">
                    <div className="flex items-center h-full px-20 bg-gray-900/40">
                        <div>
                            <h2 className="text-4xl font-bold text-white">
                                Welcome,
                            </h2>
                            <p className="max-w-xl mt-3 text-gray-300">
                                You are just one step away to something amazing!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form Container - Centers content and handles responsive padding */}
                <div className="flex items-center w-full mx-auto lg:w-full mt-20 md:mt-0 px-10 md:px-36">
                    <div className="flex-1">
                        {/* Header Area: For Titles/Logos */}
                        <div className="text-center">
                            <img
                                src={LogoImage}
                                width={120}
                                className="mx-auto mb-2"
                                alt="App Logo"
                            />
                            <h2 className="text-4xl font-bold text-center text-gray-700">
                                Create an account
                            </h2>

                            <p className="mt-3 text-gray-500">
                                Let's get you started!
                            </p>
                        </div>

                        {/* Form Content Area */}
                        <div className="mt-8">
                            <Formik<RegisterFormValues>
                                innerRef={formikRef}
                                initialValues={{
                                    firstName: "",
                                    lastName: "",
                                    username: "",
                                    phone: "",
                                    emailId: "",
                                    password: "",
                                    formMessage: undefined,
                                }}
                                validationSchema={RegisterSchema}
                                onSubmit={onFormSubmit}
                            >
                                {({ values }) => (
                                    <Form>
                                        {values.formMessage && (
                                            <div className="mb-4">
                                                <Badge
                                                    text={values.formMessage}
                                                />
                                            </div>
                                        )}

                                        {secondsLeft !== null && (
                                            <p
                                                className="mb-4 text-sm text-gray-500"
                                                role="status"
                                            >
                                                Redirecting to the login page in{" "}
                                                {secondsLeft}s...{" "}
                                                <Link
                                                    to="/user/login"
                                                    replace
                                                    className="text-purple-500 focus:outline-hidden focus:underline hover:underline"
                                                >
                                                    Go to login now
                                                </Link>
                                            </p>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Field
                                                    label="First Name"
                                                    type="text"
                                                    name="firstName"
                                                    id="firstName"
                                                    placeholder="Enter your first name"
                                                />
                                            </div>
                                            <div>
                                                <Field
                                                    label="Last Name"
                                                    type="text"
                                                    name="lastName"
                                                    id="lastName"
                                                    placeholder="Enter your last name"
                                                />
                                            </div>
                                            <div>
                                                <Field
                                                    label="Username"
                                                    type="text"
                                                    name="username"
                                                    id="username"
                                                    placeholder="Enter your username"
                                                />
                                            </div>
                                            <div>
                                                <Field
                                                    label="Email"
                                                    type="text"
                                                    name="emailId"
                                                    id="emailId"
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                            <div>
                                                <Field
                                                    label="Password"
                                                    type="password"
                                                    name="password"
                                                    id="password"
                                                    placeholder="Enter your password"
                                                />
                                            </div>
                                            <div>
                                                <Field
                                                    label="Phone"
                                                    type="text"
                                                    name="phone"
                                                    id="phone"
                                                    placeholder="Enter your phone"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <Button text="Register" />
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            <p className="mt-6 text-sm text-center text-gray-400">
                                Already have an account?{" "}
                                <Link
                                    to="/user/login"
                                    className="text-purple-500 focus:outline-hidden focus:underline hover:underline"
                                >
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
