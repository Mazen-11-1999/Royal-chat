'use client';

import { useState } from 'react';
import { Card } from '@/ui/card';
import { ScrollArea } from '@/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';
import { Pin, Search, Crown } from 'lucide-react';
import { Conversation } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  currentUserId?: string;
}

export function ConversationsList({ conversations, selectedId, onSelect, currentUserId }: ConversationsListProps) {
  const { t, dir } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out archived conversations and apply search
  const filteredConversations = conversations
    .filter(conv => !conv.isArchived) // Hide archived conversations
    .filter(conv => {
      if (conv.type === 'group') {
        return conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      const otherUser = conv.participants.find(p => p.id !== currentUserId);
      return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort: pinned first, then by last message time
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.lastMessageTime?.getTime() || a.createdAt?.getTime() || 0;
      const timeB = b.lastMessageTime?.getTime() || b.createdAt?.getTime() || 0;
      return timeB - timeA;
    });

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') return conv.name || (dir === 'rtl' ? 'مجموعة' : 'Group');
    const otherUser = conv.participants.find(p => p.id !== currentUserId);
    return otherUser?.name || (dir === 'rtl' ? 'غير معروف' : 'Unknown');
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === 'group') return conv.avatar;
    const otherUser = conv.participants.find(p => p.id !== currentUserId);
    return otherUser?.avatar || conv.avatar;
  };

  return (
    <Card className="flex flex-col h-full border-0 rounded-none bg-background" dir={dir}>
      <div className="p-3 border-b space-y-3 bg-background">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5" style={{ color: `hsl(var(--primary))` }} />
            <h2 className="text-lg font-bold" style={{
              color: `hsl(var(--primary))`
            }}>
              Royal Chat
            </h2>
          </div>
        </div>
        <div className="relative">
          <Search className={`absolute ${dir === 'rtl' ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <Input
            placeholder={t('chat.search')}
            dir={dir}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={dir === 'rtl' ? 'pr-10' : 'pl-10'} 
            style={{ backgroundColor: 'var(--muted)' }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredConversations.map((conv) => {
            const otherUser = conv.participants.find(p => p.id !== currentUserId);
            const isOnline = otherUser?.status === 'online';

            return (
              <button
                type="button"
                key={conv.id}
                onClick={() => {
                  onSelect(conv.id);
                }}
                className={cn(
                  'w-full p-4 rounded-lg mb-1 transition-all duration-200 active:bg-accent/80',
                  selectedId === conv.id && 'bg-accent shadow-sm',
                  'cursor-pointer touch-manipulation min-h-[72px]'
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={`flex items-start gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-14 h-14 border-2 border-background">
                      <AvatarImage src={getConversationAvatar(conv)} />
                      <AvatarFallback className="text-base">{getConversationName(conv)[0]}</AvatarFallback>
                    </Avatar>
                    {conv.type === 'direct' && isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className={`flex-1 min-w-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center justify-between mb-1 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                        <span className="font-semibold text-base truncate">
                          {getConversationName(conv)}
                        </span>
                        {conv.isPinned && <Pin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: `hsl(var(--primary))` }} />}
                      </div>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 ml-2">
                          {formatDistanceToNow(conv.lastMessage.timestamp, { addSuffix: false })}
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center justify-between gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <p className="text-sm text-muted-foreground truncate flex-1 min-w-0 leading-tight">
                        {(() => {
                          if (!conv.lastMessage) return t('chat.noMessages');
                          // Check if last message is from current user
                          const isFromCurrentUser = conv.lastMessage.senderId === currentUserId;
                          // Get sender name for group chats
                          if (conv.type === 'group' && !isFromCurrentUser) {
                            const sender = conv.participants.find(p => p.id === conv.lastMessage?.senderId);
                            const senderName = sender?.name || 'Unknown';
                            return `${senderName}: ${conv.lastMessage.content}`;
                          }
                          // For direct chats, show message content directly
                          if (isFromCurrentUser) {
                            return dir === 'rtl' ? `أنت: ${conv.lastMessage.content}` : `You: ${conv.lastMessage.content}`;
                          }
                          return conv.lastMessage.content;
                        })()}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="flex-shrink-0 min-w-[20px] h-5 px-1.5 text-xs font-semibold flex items-center justify-center" style={{ backgroundColor: `hsl(var(--primary))`, color: 'white' }}>
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
