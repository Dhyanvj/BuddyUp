// src/components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MessageWithSender } from '../types';
import UserAvatar from './UserAvatar';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ChatBubbleProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
  showAvatar?: boolean;
}

export default function ChatBubble({
  message,
  isCurrentUser,
  showAvatar = true,
}: ChatBubbleProps) {
  // System messages (like "User joined")
  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.content}</Text>
        <Text style={styles.systemMessageTime}>
          {dayjs(message.created_at).format('h:mm A')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        isCurrentUser ? styles.messageRowRight : styles.messageRowLeft,
      ]}
    >
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          <UserAvatar user={message.sender} size={32} />
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft,
        ]}
      >
        {!isCurrentUser && (
          <Text style={styles.senderName}>{message.sender.full_name}</Text>
        )}
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.messageTextRight : styles.messageTextLeft,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isCurrentUser ? styles.messageTimeRight : styles.messageTimeLeft,
          ]}
        >
          {dayjs(message.created_at).format('h:mm A')}
        </Text>
      </View>

      {isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          <UserAvatar user={message.sender} size={32} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  messageBubbleLeft: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextLeft: {
    color: '#1a1a1a',
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeLeft: {
    color: '#999',
  },
  messageTimeRight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  systemMessageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});