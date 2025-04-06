import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Post = {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
};

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    content: 'Just had my first pain-free day in months! The new treatment plan seems to be working. Has anyone else tried this approach?',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 7,
    isLiked: false,
  },
  {
    id: '2',
    author: {
      name: 'Michael Chen',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    content: 'Found a great support group in my area. If anyone is in Seattle and looking for in-person connections, I\'d be happy to share details!',
    timestamp: '5 hours ago',
    likes: 18,
    comments: 12,
    isLiked: true,
  },
  {
    id: '3',
    author: {
      name: 'Aisha Patel',
      avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    },
    content: 'Struggling with medication side effects today. Any tips for managing nausea while still staying on treatment?',
    timestamp: '1 day ago',
    likes: 32,
    comments: 15,
    isLiked: false,
  },
];

type PostCardProps = {
  post: Post;
  onLike: (id: string) => void;
};

const PostCard = ({ post, onLike }: PostCardProps) => {
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

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  
  const handleLike = (id: string) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="chatbubbles" size={24} color="#0d9488" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.createPostContainer}>
        <TextInput
          style={styles.postInput}
          placeholder="Share something with the community..."
          multiline
        />
        <TouchableOpacity style={styles.postButton}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButton: {
    padding: 8,
  },
  createPostContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  postInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  postButton: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
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
