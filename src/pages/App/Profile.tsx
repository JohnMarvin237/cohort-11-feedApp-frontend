import { useEffect, useState, useContext, useRef, type JSX } from "react";
import UpdateBasicProfile from "../../components/UpdateBasicProfile";
import UpdatePublicProfile from "../../components/UpdatePublicProfile";

import { AppContext } from "../../context/applicationContext";
import LoadingIndicator from "../../components/LoadingIndicator";

import { sessionApi, type StandardResponse } from "../../util/ApiUtil";

const Profile = (): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    // One single copy of the user: the context, also used by NavBar and MyProfile
    const userData = appContext?.getUserData();

    // The forms are shown once the latest data has been requested from the server
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const hasRequested = useRef<boolean>(false);

    useEffect((): void => {
        document.title = "Profile | Feed App";
    }, []);

    useEffect((): void => {
        // useRef: StrictMode runs effects twice in development, the request is sent only once
        if (!appContext || !token || hasRequested.current) return;
        hasRequested.current = true;

        const loadProfile = async (): Promise<void> => {
            const apiResponse: StandardResponse = await sessionApi(token);
            if (apiResponse.status === 1) {
                appContext.setUserData(apiResponse.payLoad);
            }
            // If the request fails, the page still opens with the data already in the context
            setIsLoaded(true);
        };

        loadProfile();
    }, [appContext, token]);

    if (!userData || !isLoaded) {
        return <LoadingIndicator />;
    }

    const publicProfile = userData.profile;

    return (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-12 md:mx-12 container px-2 mx-auto">
            <div>
                {/* No password prop: the backend never sends it (write-only) */}
                <UpdateBasicProfile
                    emailId={userData.emailId}
                    firstName={userData.firstName}
                    lastName={userData.lastName}
                    phone={userData.phone ?? ""}
                />
            </div>
            <div>
                {/* ?? "": the database can hold NULL in bio, city and country (a default value only replaces undefined) */}
                <UpdatePublicProfile
                    bio={publicProfile?.bio ?? ""}
                    city={publicProfile?.city ?? ""}
                    country={publicProfile?.country ?? ""}
                    headline={publicProfile?.headline ?? ""}
                    picture={publicProfile?.picture ?? ""}
                />
            </div>
        </main>
    );
};

export default Profile;
