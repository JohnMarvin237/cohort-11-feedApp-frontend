// Shape of the JSON sent by the backend for a feed (Feed, FeedMetaData, User and Profile entities)

export interface FeedProfile {
  picture?: string | null;
}

export interface FeedUser {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  profile?: FeedProfile | null;
}

// A like (isLike = true) or a comment (isLike = false, comment filled)
export interface FeedMetaData {
  feedMetaDataId?: number;
  isLike: boolean;
  comment: string | null;
  createdOn: string;
  user?: FeedUser | null;
}

export interface Feed {
  feedId: number;
  content: string;
  picture?: string | null;
  createdOn: string;
  user: FeedUser;
  feedMetaData?: FeedMetaData[];
}