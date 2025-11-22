'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { ScrollArea } from '@/ui/scroll-area';
import { Search, X, ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { Message } from '@/types/chat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageSearchProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage: (messageId: string) => void;
  currentUserId?: string;
}

export function MessageSearch({ messages, isOpen, onClose, onSelectMessage, currentUserId }: MessageSearchProps) {
  const { dir } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages([]);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = messages.filter(msg => 
      msg.content?.toLowerCase().includes(query)
    );
    
    setFilteredMessages(filtered);
    setSelectedIndex(0);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (filteredMessages.length > 0 && selectedIndex >= 0) {
      const messageId = filteredMessages[selectedIndex]?.id;
      if (messageId) {
        const element = scrollRefs.current.get(messageId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [selectedIndex, filteredMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredMessages.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredMessages.length > 0) {
      e.preventDefault();
      const message = filteredMessages[selectedIndex];
      if (message) {
        onSelectMessage(message.id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {dir === 'rtl' ? 'البحث في الرسائل' : 'Search Messages'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
            <Input
              placeholder={dir === 'rtl' ? 'ابحث في الرسائل...' : 'Search messages...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
              dir={dir}
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute ${dir === 'rtl' ? 'left' : 'right'}-1 top-1/2 transform -translate-y-1/2 h-6 w-6`}
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
              <span>
                {filteredMessages.length > 0 
                  ? `${filteredMessages.length} ${dir === 'rtl' ? 'نتيجة' : 'results'}`
                  : dir === 'rtl' ? 'لا توجد نتائج' : 'No results'}
              </span>
              {filteredMessages.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {dir === 'rtl' ? 'استخدم' : 'Use'} ↑↓ {dir === 'rtl' ? 'للتنقل' : 'to navigate'}
                  </span>
                </div>
              )}
            </div>
          )}

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2">
              {filteredMessages.map((message, index) => {
                const isSelected = index === selectedIndex;
                const isCurrentUser = message.senderId === currentUserId;
                
                return (
                  <div
                    key={message.id}
                    ref={(el) => {
                      if (el) scrollRefs.current.set(message.id, el);
                    }}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-all',
                      isSelected 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                    )}
                    onClick={() => {
                      onSelectMessage(message.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {isCurrentUser ? (dir === 'rtl' ? 'أنت' : 'You') : message.senderId}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(message.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm break-words">
                      {highlightText(message.content || '', searchQuery)}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

