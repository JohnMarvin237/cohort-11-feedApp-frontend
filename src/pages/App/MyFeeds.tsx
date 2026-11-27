import {
    useCallback,
    useEffect,
    useContext,
    useRef,
    useState,
    type JSX,
} from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import MyProfile from "../../components/MyProfile";
import FeedCard from "../../components/FeedCard";

import { AppContext } from "../../context/applicationContext";
import LoadingIndicator from "../../components/LoadingIndicator";

import { getMyFeedsApi, type StandardResponse } from "../../util/ApiUtil";
import type { Feed } from "../../types/feed";

const MyFeeds = (): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    const userData = appContext?.getUserData();

    const [feedsData, setFeedsData] = useState<Feed[]>([]);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [hasMore, setHasMore] = useState<boolean>(true);
    // Incremented on each reload of page 0: the FeedCards start again from the fresh server data
    const [loadCount, setLoadCount] = useState<number>(0);
    const hasLoadedFirstPage = useRef<boolean>(false);

    // Declared before the effect that uses it, and memoized so it can be one of its dependencies
    const getMyFeeds = useCallback(
        async (loadPageNumber: number): Promise<void> => {
            if (!token) return;

            const apiResponse: StandardResponse = await getMyFeedsApi(
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
                // Pages go from 0 to totalPages - 1; also covers "no feed at all" (totalPages = 0)
                setHasMore(loadPageNumber + 1 < apiResponse.payLoad.totalPages);
            }
        },
        [token],
    );

    useEffect((): void => {
        document.title = "My Feeds | Feed App";
    }, []);

    // useRef: StrictMode runs effects twice in development, page 0 must be requested only once
    useEffect((): void => {
        if (hasLoadedFirstPage.current) return;
        hasLoadedFirstPage.current = true;
        getMyFeeds(0);
    }, [getMyFeeds]);

    if (!userData) {
        return <LoadingIndicator />;
    }

    return (
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-12 mx-0 md:mx-12 container px-2 mx-auto">
            <MyProfile />
            <article>
                <InfiniteScroll
                    dataLength={feedsData.length}
                    next={(): void => {
                        getMyFeeds(pageNumber);
                    }}
                    hasMore={hasMore}
                    loader={
                        <p className="text-center text-sm text-gray-500 my-4">
                            Loading...
                        </p>
                    }
                    endMessage={
                        feedsData.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 my-4">
                                You have not posted any feed yet.
                            </p>
                        ) : (
                            <p className="text-center my-4">
                                <b>Yay! You have seen it all.</b>
                            </p>
                        )
                    }
                    refreshFunction={(): void => {
                        getMyFeeds(0);
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
                                    loadOnDelete={getMyFeeds}
                                />
                            ),
                        )}
                    </div>
                </InfiniteScroll>
            </article>
        </main>
    );
};

export default MyFeeds;
