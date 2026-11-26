import {
    useCallback,
    useEffect,
    useContext,
    useRef,
    useState,
    type JSX,
} from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { AppContext } from "../../context/applicationContext";
import LoadingIndicator from "../../components/LoadingIndicator";
import MyProfile from "../../components/MyProfile";
import AddFeed from "../../components/AddFeed";
import FeedCard from "../../components/FeedCard";
import { getOthersFeedsApi, type StandardResponse } from "../../util/ApiUtil";
import type { Feed } from "../../types/feed";

const Dashboard = (): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    const userData = appContext?.getUserData();

    const [feedsData, setFeedsData] = useState<Feed[]>([]);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    // Incremented on each reload of page 0: the FeedCards start again from the fresh server data
    const [loadCount, setLoadCount] = useState<number>(0);
    const hasLoadedFirstPage = useRef<boolean>(false);

    const getOthersFeeds = useCallback(
        async (loadPageNumber: number): Promise<void> => {
            if (!token) return;

            const apiResponse: StandardResponse = await getOthersFeedsApi(
                token,
                loadPageNumber,
            );

            if (apiResponse.status === 1) {
                const newFeeds: Feed[] = apiResponse.payLoad.content;

                // Page 0 replaces the list, later pages are added at the end (always a new array)
                setFeedsData((previousFeeds) =>
                    loadPageNumber === 0
                        ? newFeeds
                        : [...previousFeeds, ...newFeeds],
                );
                if (loadPageNumber === 0) {
                    setLoadCount((count) => count + 1);
                }
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
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-12 mx-0 md:mx-12 container px-2 mx-auto">
            <MyProfile />
            <article>
                <AddFeed />

                <InfiniteScroll
                    dataLength={feedsData.length}
                    next={(): void => {
                        getOthersFeeds(pageNumber);
                    }}
                    hasMore={hasMore}
                    loader={
                        <p className="text-center text-sm text-gray-500 my-4">
                            Loading...
                        </p>
                    }
                    endMessage={
                        <p className="text-center my-4">
                            <b>Yay! You have seen it all.</b>
                        </p>
                    }
                    refreshFunction={(): void => {
                        getOthersFeeds(0);
                    }}
                    pullDownToRefresh
                    pullDownToRefreshThreshold={50}
                    pullDownToRefreshContent={
                        <h3 className="text-center">
                            &#8595; Pull down to refresh
                        </h3>
                    }
                    releaseToRefreshContent={
                        <h3 className="text-center">
                            &#8593; Release to refresh
                        </h3>
                    }
                >
                    <div className="mt-3">
                        {feedsData.map(
                            ({
                                feedId,
                                picture,
                                content,
                                createdOn,
                                feedMetaData,
                                user,
                            }) => (
                                <FeedCard
                                    key={`${loadCount}-${feedId}`}
                                    feedId={feedId}
                                    picture={picture}
                                    content={content}
                                    createdOn={createdOn}
                                    username={user.username}
                                    firstName={user.firstName}
                                    lastName={user.lastName}
                                    profilePicture={user.profile?.picture}
                                    feedMetaData={feedMetaData}
                                />
                            ),
                        )}
                    </div>
                </InfiniteScroll>
            </article>
        </main>
    );
};

export default Dashboard;
