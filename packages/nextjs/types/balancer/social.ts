// Social types for the social section component
import type { UserProfile } from "./user";

export interface SocialComment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

export interface SocialUser extends UserProfile {
  followers: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  level?: string;
  bio?: string;
}

export interface SocialMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  bookmarks: number;
}

export interface SocialEngagement {
  isLiked: boolean;
  isBookmarked: boolean;
  isShared: boolean;
}

export interface SocialTags {
  tags: string[];
  categories: string[];
}
