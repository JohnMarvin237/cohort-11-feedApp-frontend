import {
    useCallback,
    useEffect,
    useContext,
    useRef,
    useState,
    type JSX,
} from "react";
import { AppContext } from "../../context/applicationContext";
import LoadingIndicator from "../../components/LoadingIndicator";
import { getOthersFeedsApi, type StandardResponse } from "../../util/ApiUtil";
import MyProfile from "../../components/MyProfile";
import AddFeed from "../../components/AddFeed";

// A feed as returned by the backend: its fields will be detailed when FeedCard uses them
type Feed = Record<string, unknown>;

const Dashboard = (): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    const userData = appContext?.getUserData();

    const [feedsData, setFeedsData] = useState<Feed[]>([]);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const hasLoadedFirstPage = useRef<boolean>(false);

    const getOthersFeeds = useCallback(
        async (loadPageNumber: number): Promise<void> => {
            if (!token) return;

            const apiResponse: StandardResponse = await getOthersFeedsApi(
                token,
                loadPageNumber,
            );

            console.log(apiResponse);

            if (apiResponse.status === 1) {
                const newFeeds: Feed[] = apiResponse.payLoad.content;

                // Page 0 replaces the list, later pages are added at the end (always a new array)
                setFeedsData((previousFeeds) =>
                    loadPageNumber === 0
                        ? newFeeds
                        : [...previousFeeds, ...newFeeds],
                );
                setPageNumber(loadPageNumber + 1);
                setHasMore(loadPageNumber + 1 < apiResponse.payLoad.totalPages);
            }
        },
        [token],
    );

    useEffect((): void => {
        document.title = "Home | Feed App";
    }, []);

    useEffect((): void => {
        if (hasLoadedFirstPage.current) return;
        hasLoadedFirstPage.current = true;
        getOthersFeeds(0);
    }, [getOthersFeeds]);

    if (!userData) {
        return <LoadingIndicator />;
    }

    return (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-12 md:mx-12 container px-2 mx-auto">
            {/* {#MyProfile Component} */}
            <MyProfile />
            <article>
                {/* {#AddFeed Component} */}
                <AddFeed />
                {/* {#FeedCard Component} */}
                {/* Temporary check, until FeedCard and InfiniteScroll use this state */}
                <p className="text-sm text-gray-500">
                    {feedsData.length} feeds loaded (next page: {pageNumber},
                    more: {hasMore ? "yes" : "no"})
                </p>
            </article>
        </main>
    );
};

export default Dashboard;
