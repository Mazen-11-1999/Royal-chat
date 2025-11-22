'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { ScrollArea } from '@/ui/scroll-area';
import { Input } from '@/ui/input';
import { Image as ImageIcon, File, Video, Music, MapPin, X, Download, Search } from 'lucide-react';
import { Message } from '@/types/chat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MediaGalleryProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMessage?: (messageId: string) => void;
}

type MediaType = 'all' | 'images' | 'videos' | 'files' | 'audio' | 'locations';

export function MediaGallery({ messages, isOpen, onClose, onSelectMessage }: MediaGalleryProps) {
  const { dir } = useLanguage();
  const [selectedType, setSelectedType] = useState<MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Extract media from messages
  const mediaItems = messages
    .filter(msg => msg.attachments && msg.attachments.length > 0)
    .flatMap(msg => 
      msg.attachments!.map(att => ({
        ...att,
        messageId: msg.id,
        timestamp: msg.timestamp,
        senderId: msg.senderId
      }))
    )
    .filter(item => {
      if (selectedType === 'all') return true;
      if (selectedType === 'images') return item.type === 'image';
      if (selectedType === 'videos') return item.type === 'video';
      if (selectedType === 'files') return item.type === 'file';
      if (selectedType === 'audio') return item.type === 'audio' || item.type === 'voice';
      if (selectedType === 'locations') return item.type === 'location';
      return true;
    })
    .filter(item => {
      if (!searchQuery) return true;
      return item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.url?.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleDownload = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'file':
        return <File className="w-5 h-5" />;
      case 'audio':
      case 'voice':
        return <Music className="w-5 h-5" />;
      case 'location':
        return <MapPin className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {dir === 'rtl' ? 'معرض الوسائط' : 'Media Gallery'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {(['all', 'images', 'videos', 'files', 'audio', 'locations'] as MediaType[]).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="flex-shrink-0"
                >
                  {type === 'all' && (dir === 'rtl' ? 'الكل' : 'All')}
                  {type === 'images' && (dir === 'rtl' ? 'صور' : 'Images')}
                  {type === 'videos' && (dir === 'rtl' ? 'فيديو' : 'Videos')}
                  {type === 'files' && (dir === 'rtl' ? 'ملفات' : 'Files')}
                  {type === 'audio' && (dir === 'rtl' ? 'صوت' : 'Audio')}
                  {type === 'locations' && (dir === 'rtl' ? 'مواقع' : 'Locations')}
                </Button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                placeholder={dir === 'rtl' ? 'ابحث في الوسائط...' : 'Search media...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
                dir={dir}
              />
            </div>

            {/* Media Grid */}
            <ScrollArea className="flex-1 min-h-0">
              {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {dir === 'rtl' ? 'لا توجد وسائط' : 'No media found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {mediaItems.map((item, index) => (
                    <div
                      key={`${item.messageId}-${index}`}
                      className={cn(
                        'relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all',
                        item.type === 'image' ? 'aspect-square' : 'aspect-video'
                      )}
                      onClick={() => {
                        if (item.type === 'image') {
                          setSelectedImage(item.url);
                        } else if (onSelectMessage) {
                          onSelectMessage(item.messageId);
                          onClose();
                        }
                      }}
                    >
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name || 'Image'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {getMediaIcon(item.type)}
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="text-white text-center p-2">
                          <p className="text-xs truncate">{item.name}</p>
                          {item.size && (
                            <p className="text-xs opacity-75">{formatFileSize(item.size)}</p>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.url, item.name || 'file');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Stats */}
            <div className="text-sm text-muted-foreground text-center pt-2 border-t">
              {dir === 'rtl' ? 'إجمالي الوسائط: ' : 'Total media: '}{mediaItems.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir={dir}>
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

