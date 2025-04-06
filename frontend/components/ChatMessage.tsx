import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
};

type ChatMessageProps = {
  message: Message;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <View style={[styles.container, message.isUser ? styles.userContainer : styles.assistantContainer]}>
      {!message.isUser && (
        <View style={styles.avatarContainer}>
          <Ionicons name="medical-outline" size={20} color="#0d9488" />
        </View>
      )}
      
      <View style={[styles.bubble, message.isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, message.isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
        
        <Text style={styles.timestamp}>
          {message.timestamp}
        </Text>
      </View>
      
      {message.isUser && (
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>ME</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6fffa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#0d9488',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    alignSelf: 'flex-end',
  },
});