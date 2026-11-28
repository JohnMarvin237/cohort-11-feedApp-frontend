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
        if (axios.isAxiosError<{ message?: string }>(err)) {
            if (err.response) {
                response = frameResponse(0, err.response.data.message);
            }
            // Only the message: the full axios error holds the request body, password included
            console.log(err.message);
        } else {
            console.log(err);
        }
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
        // Only the message: the full axios error holds the request body, password included
        console.error(
            "Login API Error:",
            axios.isAxiosError(err) ? err.message : err,
        );
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

export const resetPasswordApi = async (
    token: string,
    password: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/reset`;

        const apiResponse = await axios.post(
            url,
            { password },
            {
                headers: {
                    Authorization: frameToken(token),
                },
            },
        );

        if (apiResponse.status === 200) {
            response = frameResponse(1);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        // Only the message: the full axios error holds the request body, password included
        console.error(
            "Reset Password API Error:",
            axios.isAxiosError(err) ? err.message : err,
        );
    }

    return response;
};

export const sessionApi = async (token: string): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/get`;

        const apiResponse = await axios.get(url, {
            headers: {
                Authorization: frameToken(token),
            },
        });

        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.error("Session Validation Error:", err);
    }

    return response;
};

export const updatePublicProfileApi = async (
    token: string,
    bio: string,
    city: string,
    country: string,
    headline: string,
    picture: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/update/profile`;
        const apiResponse = await axios.post(
            url,
            {
                bio,
                city,
                country,
                headline,
                picture,
            },
            { headers: { Authorization: frameToken(token) } },
        );

        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.log(err);
    }

    return response;
};

export const getOthersFeedsApi = async (
    token: string,
    pageNumber: number,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/feeds/other/${pageNumber}/5`;
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
        console.log(err);
    }

    return response;
};

export const addFeedApi = async (
    token: string,
    content: string,
    picture: string | null,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/feeds`;
        const apiResponse = await axios.post(
            url,
            {
                content,
                picture,
            },
            { headers: { Authorization: frameToken(token) } },
        );

        // The backend answers 201 Created. Axios already rejects non-2xx responses,
        // so reaching this line means success. payLoad = the created feed.
        response = frameResponse(1, apiResponse.data);
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.log(err);
    }

    return response;
};

export const addFeedMetaDataApi = async (
    token: string,
    feedId: string | number,
    isLike: boolean | null,
    comment: string | null,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/feeds/meta/${feedId}`;
        const apiResponse = await axios.post(
            url,
            {
                isLike,
                comment,
            },
            { headers: { Authorization: frameToken(token) } },
        );

        // Any 2xx (200 OK or 201 Created) means success: axios rejects the other codes.
        // payLoad = the like/comment saved by the backend.
        response = frameResponse(1, apiResponse.data);
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.log(err);
    }

    return response;
};

export const getMyFeedsApi = async (
    token: string,
    pageNumber: number,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        // "/5" = 5 feeds per page
        const url: string = `${API_BASE_URL}/feeds/user/${pageNumber}/5`;
        const apiResponse = await axios.get(url, {
            headers: { Authorization: frameToken(token) },
        });

        // payLoad = the Spring page: content (the feeds) and totalPages
        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data.message);
        }
        console.log(err);
    }

    return response;
};

export const updateBasicProfileApi = async (
    token: string,
    password?: string,
    emailId?: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/update`;
        const apiResponse = await axios.post(
            url,
            {
                password,
                emailId,
                firstName,
                lastName,
                phone,
            },
            { headers: { Authorization: frameToken(token) } },
        );

        // payLoad = the updated user
        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err)) {
            if (err.response) {
                response = frameResponse(0, err.response.data.message);
            }
            // Only the message: the full axios error holds the request body, password included
            console.log(err.message);
        } else {
            console.log(err);
        }
    }

    return response;
};

export const deleteFeedApi = async (
    token: string,
    feedId: string | number,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/feeds/${feedId}`;
        await axios.delete(url, {
            headers: { Authorization: frameToken(token) },
        });

        // Any 2xx (200 OK or 204 No Content) means success: axios rejects the other codes
        response = frameResponse(1);
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data?.message);
        } else {
            console.log(err);
        }
    }

    return response;
};

export const getCommentSuggestionsApi = async (
    token: string,
    feedId: string | number,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/feeds/${feedId}/comment-suggestions`;
        const apiResponse = await axios.get<string[]>(url, {
            headers: { Authorization: frameToken(token) },
        });

        // payLoad = at most 2 suggested comments (strings)
        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            // 503 Service Unavailable = the AI service failed or is not configured
            response = frameResponse(
                0,
                err.response.data?.message ??
                    "AI suggestions are unavailable right now. Please try again later.",
            );
        }
        console.log(err);
    }

    return response;
};

export const uploadAiAvatarApi = async (
    token: string,
    avatar: Blob,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/update/avatar`;

        // A real file upload (multipart/form-data): axios sets the Content-Type and its boundary itself
        const formData = new FormData();
        formData.append("file", avatar, "ai-avatar");

        const apiResponse = await axios.post(url, formData, {
            headers: { Authorization: frameToken(token) },
        });

        // payLoad = the updated user, with the new profile picture
        if (apiResponse.status === 200) {
            response = frameResponse(1, apiResponse.data);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err) && err.response) {
            response = frameResponse(0, err.response.data?.message);
        }
        console.log(err);
    }

    return response;
};

export const generateAiAvatarApi = async (
    token: string,
    description: string,
    startingPhoto: Blob | null,
): Promise<StandardResponse> => {
    let response: StandardResponse = frameResponse();

    try {
        const url: string = `${API_BASE_URL}/user/avatar/generate`;

        const formData = new FormData();
        formData.append("description", description);
        if (startingPhoto) {
            formData.append("photo", startingPhoto, "starting-photo");
        }

        const apiResponse = await axios.post<{ picture?: string }>(
            url,
            formData,
            {
                headers: { Authorization: frameToken(token) },
            },
        );

        // payLoad = the generated avatar ("data:image/jpeg;base64,..."): a preview, not saved yet
        if (apiResponse.status === 200 && apiResponse.data.picture) {
            response = frameResponse(1, apiResponse.data.picture);
        }
    } catch (err) {
        if (axios.isAxiosError<{ message?: string }>(err)) {
            if (err.response) {
                // 400 = description refused or invalid photo, 503 = the AI service failed
                response = frameResponse(
                    0,
                    err.response.data?.message ??
                        "The avatar could not be generated. Please try again later.",
                );
            }
            console.log(err.message);
        } else {
            console.log(err);
        }
    }

    return response;
};
