import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

export type MediaContent = {
  type: 'image' | 'video';
  url: string | number; // Can be URL string or require'd image
  thumbnail?: string | number; // Thumbnail for videos - can be URL string or require'd image
  aspectRatio?: number; // For maintaining media dimensions
};

export type Post = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  media?: MediaContent[];
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
};

type PostCardProps = {
  post: Post;
  onLike: (id: string) => void;
};

export const PostCard = ({ post, onLike }: PostCardProps) => {
  const renderMedia = (media: MediaContent) => {
    const screenWidth = Dimensions.get('window').width - 32; // Full width minus padding
    const mediaHeight = media.aspectRatio ? screenWidth / media.aspectRatio : screenWidth;

    if (media.type === 'image') {
      return (
        <Image
          source={typeof media.url === 'string' ? { uri: media.url } : media.url}
          style={[styles.mediaContent, { height: mediaHeight }]}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <Video
          source={typeof media.url === 'string' ? { uri: media.url } : media.url}
          style={[styles.mediaContent, { height: mediaHeight }]}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          isLooping
          posterSource={typeof media.thumbnail === 'string' ? { uri: media.thumbnail } : media.thumbnail}
          posterStyle={{ height: mediaHeight }}
        />
      );
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
        <View>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
        </View>
      </View>
      
      <Text style={styles.postContent}>{post.content}</Text>
      
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media.map((media, index) => (
            <View key={index} style={styles.mediaWrapper}>
              {renderMedia(media)}
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={22} 
            color={post.isLiked ? "#e11d48" : "#6b7280"} 
          />
          <Text style={styles.actionText}>{post.likes}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
    gap: 8,
  },
  mediaWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  mediaContent: {
    width: '100%',
    backgroundColor: '#f3f4f6',
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 4,
    color: '#6b7280',
    fontSize: 14,
  },
});
