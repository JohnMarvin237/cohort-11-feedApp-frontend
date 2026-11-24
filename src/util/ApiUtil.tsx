import axios from "axios";

const API_BASE_URL: string = "http://localhost:8080";

export const frameToken = (token: string): string => `Bearer ${token}`;

export interface StandardResponse {
    status: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payLoad: any;
}

const frameResponse = (
    reqStatus: number = 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reqPayLoad: any = "Invalid request. Please try again later.",
): StandardResponse => {
    return {
        status: reqStatus,
        payLoad: reqPayLoad,
    };
};

export const registerApi = async (
    username: string,
    password: string,
    emailId: string,
    firstName: string,
    lastName: string,
    phone: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/signup`;
        const apiResponse = await axios.post(url, {
            username,
            password,
            emailId,
            firstName,
            lastName,
            phone,
        });

        if (apiResponse.status === 200) {
            response = frameResponse(1);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.log(err);
    }
    return response;
};

export const verifyEmailApi = async (
    token: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/verify/email`;
        const apiResponse = await axios.get(url, {
            headers: { Authorization: frameToken(token) },
        });

        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.error("Email Verification Error:", err);
    }
    return response;
};

export const loginApi = async (
    username: string,
    password: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/login`;
        const apiResponse = await axios.post(url, { username, password });

        if (apiResponse.status === 200) {
            const payLoad = {
                userData: apiResponse.data,
                token: apiResponse.headers.authorization,
            };

            response = frameResponse(1, payLoad);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.error("Login API Error:", err);
    }
    return response;
};

export const forgotPasswordApi = async (
    email: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();
    try {
        const url: string = `${API_BASE_URL}/user/reset/${encodeURIComponent(email)}`;
        const apiResponse = await axios.get(url);

        if (apiResponse.status === 200) {
            response = frameResponse(1);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.error("Forgot Password API Error:", err);
    }
    return response;
};
