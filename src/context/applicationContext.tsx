import { createContext, useState , type JSX } from "react";
import { useCookies } from "react-cookie";

interface UserProfile {
    bio?: string;
    city?: string;
    country?: string;
    headline?: string;
    picture?: string;
}

// Same field names as the User entity's JSON (password is write-only, never sent)
interface UserSession {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    emailId: string;
    phone?: string;
    emailVerified?: boolean;
    createdOn?: string;
    profile?: UserProfile | null;
}

export interface AppContextType {
    setSession: (token: string) => void;
    getSession: () => string | null;
    setUserData: (userData: UserSession | undefined) => void;
    getUserData: () => UserSession | undefined;
    logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppContextProviderProps {
  children: React.ReactNode;
}

const AppContextProvider = ({ children }: AppContextProviderProps): JSX.Element => {
    const [cookies, setCookie, removeCookie] = useCookies<"appToken">(["appToken"]);    

    const [userSessionData, setUserSessionData] = useState<UserSession | undefined>(undefined);

    const setSession = (token: string): void => {
        setCookie("appToken", token, {
            path: "/",
            maxAge: 900, // 15 minutes
        });
    };

    const getSession = (): string | null => {
        const token: string | null = cookies.appToken || null;
        return token;
    };

    const setUserData = (userData: UserSession | undefined): void => setUserSessionData(userData);

    const getUserData = (): UserSession | undefined => userSessionData;

    const logout = (): void => {
        removeCookie("appToken", { path: "/" });
        setUserData(undefined); 
    };

    

    return (<AppContext.Provider
    value={{
        setSession,
        getSession,
        setUserData,
        getUserData,
        logout,
    }}
    >
        {children}
    </AppContext.Provider> 
    );  
};

// eslint-disable-next-line react-refresh/only-export-components
export { AppContext };
export default AppContextProvider;