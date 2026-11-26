import { useContext, useMemo, useState, type JSX } from "react";
import { Formik, Form, Field, type FormikHelpers } from "formik";
import * as Yup from "yup";
import NoProfileImage from "../assets/images/no-profile.png";

import { AppContext } from "../context/applicationContext";
import { addFeedMetaDataApi, type StandardResponse } from "../util/ApiUtil";
import { formatDateTime, isImageDataUrl } from "../util/Helper";
import type { FeedMetaData } from "../types/feed";

interface CommentData {
    id: string | number;
    cFirstName: string;
    cLastName: string;
    cPicture?: string | null;
    cComment: string;
    cCreatedOn: string | Date;
}

interface FeedCardProps {
    feedId: number;
    picture?: string | null;
    content: string;
    createdOn: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
    feedMetaData?: FeedMetaData[];
}

interface CommentFormValues {
    comment: string;
}

// Same empty array on every render (a new [] each time would recompute the likes and comments)
const NO_METADATA: FeedMetaData[] = [];

const AddCommentSchema: Yup.ObjectSchema<CommentFormValues> =
    Yup.object().shape({
        comment: Yup.string().trim().required("Required"),
    });

// Avatar to show: the default picture when there is none or when it is not a real image
const avatarOf = (picture?: string | null): string =>
    isImageDataUrl(picture) ? picture : NoProfileImage;

// Declared outside FeedCard: a component declared inside another one is recreated,
// and its DOM rebuilt, on every render of its parent
const CommentCard = ({
    cFirstName,
    cLastName,
    cPicture,
    cComment,
    cCreatedOn,
}: Omit<CommentData, "id">): JSX.Element => (
    <div className="text-black p-4 antialiased flex">
        <img
            className="rounded-full h-8 w-8 mr-2 mt-1 object-cover"
            src={avatarOf(cPicture)}
            alt={`${cFirstName} ${cLastName}`}
        />
        <div>
            <div className="bg-gray-100 rounded-lg px-4 pt-2 pb-2.5">
                <div className="font-semibold text-sm leading-relaxed">
                    {cFirstName} {cLastName}
                </div>
                <div className="text-xs leading-snug md:leading-normal whitespace-pre-line break-words">
                    {cComment}
                </div>
            </div>
            <div className="text-xs mt-0.5 text-gray-500">
                {formatDateTime(cCreatedOn)}
            </div>
        </div>
    </div>
);

const FeedCard = ({
    feedId,
    picture,
    content,
    createdOn,
    username,
    firstName,
    lastName,
    profilePicture,
    feedMetaData = NO_METADATA,
}: FeedCardProps): JSX.Element => {
    const appContext = useContext(AppContext);
    const token: string | null = appContext?.getSession() ?? null;
    const userData = appContext?.getUserData();
    const currentUserId = userData?.userId;

    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Added in this card since the feeds were loaded (not in feedMetaData yet)
    const [likedHere, setLikedHere] = useState<boolean>(false);
    const [addedComments, setAddedComments] = useState<CommentData[]>([]);

    // Likes and comments loaded from the server, derived from the props (no copy in state)
    const loaded = useMemo(() => {
        let likes = 0;
        let userLiked = false;
        const comments: CommentData[] = [];

        feedMetaData.forEach((metaData, index) => {
            if (metaData.isLike) {
                likes++;
                if (
                    currentUserId !== undefined &&
                    metaData.user?.userId === currentUserId
                ) {
                    userLiked = true;
                }
            } else if (metaData.comment) {
                comments.push({
                    id: metaData.feedMetaDataId ?? `loaded-${index}`,
                    cComment: metaData.comment,
                    cCreatedOn: metaData.createdOn,
                    cFirstName: metaData.user?.firstName ?? "",
                    cLastName: metaData.user?.lastName ?? "",
                    cPicture: metaData.user?.profile?.picture,
                });
            }
        });

        return { likes, userLiked, comments };
    }, [feedMetaData, currentUserId]);

    const userLiked: boolean = loaded.userLiked || likedHere;
    const noOfLikes: number =
        loaded.likes + (likedHere && !loaded.userLiked ? 1 : 0);
    const comments: CommentData[] = [...loaded.comments, ...addedComments];

    const addFeedMetaData = async (
        isLike: boolean,
        comment: string | null,
    ): Promise<StandardResponse | null> => {
        if (isFetching || !token) return null;

        setIsFetching(true);
        setErrorMessage(null);

        const apiResponse: StandardResponse = await addFeedMetaDataApi(
            token,
            feedId,
            isLike,
            comment,
        );

        if (apiResponse.status !== 1) {
            setErrorMessage(apiResponse.payLoad);
        }

        setIsFetching(false);
        return apiResponse;
    };

    const addLike = async (): Promise<void> => {
        if (userLiked) return;

        const apiResponse = await addFeedMetaData(true, null);
        if (apiResponse?.status === 1) {
            setLikedHere(true);
        }
    };

    const addComment = async (
        values: CommentFormValues,
        { resetForm }: FormikHelpers<CommentFormValues>,
    ): Promise<void> => {
        const comment = values.comment.trim();

        // isLike = false: the database refuses NULL in "FeedMetaData".isLike
        const apiResponse = await addFeedMetaData(false, comment);
        if (apiResponse?.status === 1) {
            resetForm();
            // New array (never push into the existing one): React only re-renders on a new reference
            setAddedComments((previous) => [
                ...previous,
                {
                    id:
                        apiResponse.payLoad?.feedMetaDataId ??
                        `new-${Date.now()}`,
                    cComment: comment,
                    cCreatedOn: new Date(),
                    cFirstName: userData?.firstName ?? "",
                    cLastName: userData?.lastName ?? "",
                    cPicture: userData?.profile?.picture,
                },
            ]);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg mb-5">
            <div className="flex w-full border-t border-gray-100">
                <div className="flex flex-row w-full py-2">
                    {/* CardHeader */}
                    <div className="flex flex-row px-2 py-3 mx-3">
                        <img
                            className="w-12 h-12 object-cover rounded-full shadow"
                            alt={`${firstName} ${lastName}`}
                            src={avatarOf(profilePicture)}
                        />
                        <div className="flex flex-col mb-2 ml-4 mt-1">
                            <div className="text-gray-600 text-sm font-semibold">
                                {firstName} {lastName}
                            </div>
                            <div className="flex w-full mt-1">
                                <div className="text-purple-700 font-normal text-xs mr-1">
                                    @{username}
                                </div>
                                <div className="text-gray-600 font-thin text-xs">
                                    • {formatDateTime(createdOn)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* {#DeleteFeedButton Section} */}

            <div className="border-b border-gray-100"></div>

            {/* CardBody: the picture keeps its own proportions (w-full h-auto, nothing cropped) */}
            {isImageDataUrl(picture) && (
                <div className="mb-7 mt-6 mx-3 px-2">
                    <img
                        className="rounded w-full h-auto"
                        src={picture}
                        alt="Feed content"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="text-gray-800 text-sm mb-6 mx-3 px-2 whitespace-pre-line break-words">
                {content}
            </div>

            {/* LikeAndCommentCount */}
            <div className="flex w-full border-t border-gray-100">
                <div className="mt-3 mx-5 flex flex-row text-xs">
                    <button
                        type="button"
                        onClick={addLike}
                        disabled={userLiked || isFetching}
                        aria-pressed={userLiked}
                        aria-label={
                            userLiked ? "You like this feed" : "Like this feed"
                        }
                        className="transition ease-out duration-300 hover:bg-gray-50 bg-gray-100 h-8 px-2 py-2 text-center rounded-full cursor-pointer disabled:cursor-default"
                    >
                        <svg
                            className={`h-4 w-4 ${userLiked ? "text-red-500" : "text-gray-500"}`}
                            fill={userLiked ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                            ></path>
                        </svg>
                    </button>
                </div>
                <div className="mt-3 mx-5 w-full flex justify-end text-xs">
                    <div className="flex text-gray-700 rounded-md mb-2 mr-4 items-center">
                        Likes:{" "}
                        <div className="ml-1 text-gray-400">{noOfLikes}</div>
                    </div>
                    <div className="flex text-gray-700 font-normal rounded-md mb-2 mr-4 items-center">
                        Comments:{" "}
                        <div className="ml-1 text-gray-400">
                            {comments.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments */}
            <div>
                {comments.map(({ id, ...comment }) => (
                    <CommentCard key={id} {...comment} />
                ))}
            </div>

            {/* AddCommentForm */}
            <Formik<CommentFormValues>
                initialValues={{ comment: "" }}
                validationSchema={AddCommentSchema}
                onSubmit={addComment}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <div className="relative flex items-center self-center w-full p-4 overflow-hidden text-gray-600 focus-within:text-gray-400">
                            <span className="absolute inset-y-0 right-0 flex items-center pr-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    aria-label="Post the comment"
                                    className="p-1 focus:outline-hidden focus:shadow-none hover:text-purple-500"
                                >
                                    <svg
                                        className="ml-1"
                                        viewBox="0 0 24 24"
                                        width="16"
                                        height="16"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <line
                                            x1="22"
                                            y1="2"
                                            x2="11"
                                            y2="13"
                                        ></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </span>
                            <Field
                                id={`comment-${feedId}`}
                                name="comment"
                                type="text"
                                autoComplete="off"
                                aria-label="Comment"
                                className="w-full py-2 pl-4 pr-10 text-sm bg-gray-100 border border-transparent appearance-none rounded-full placeholder-gray-400 focus:bg-white focus:outline-hidden focus:border-purple-500 focus:text-gray-900"
                                placeholder="Post a comment..."
                            />
                        </div>
                        {errorMessage && (
                            <p className="px-4 pb-3 text-red-600 text-xs italic">
                                {errorMessage}
                            </p>
                        )}
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default FeedCard;
