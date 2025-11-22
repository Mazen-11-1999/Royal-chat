'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Calendar, Clock, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface ScheduledMessagesProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (content: string, scheduledTime: Date) => void;
}

export function ScheduledMessages({
  conversationId,
  isOpen,
  onClose,
  onSchedule
}: ScheduledMessagesProps) {
  const { dir } = useLanguage();
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSchedule = () => {
    if (!content.trim() || !date || !time) {
      alert(dir === 'rtl' ? 'يرجى إدخال الرسالة والتاريخ والوقت' : 'Please enter message, date, and time');
      return;
    }

    const scheduledDateTime = new Date(`${date}T${time}`);
    
    if (scheduledDateTime <= new Date()) {
      alert(dir === 'rtl' ? 'يجب أن يكون التاريخ والوقت في المستقبل' : 'Date and time must be in the future');
      return;
    }

    onSchedule(content, scheduledDateTime);
    setContent('');
    setDate('');
    setTime('');
    onClose();
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const minTime = date === today ? new Date().toTimeString().slice(0, 5) : '00:00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {dir === 'rtl' ? 'جدولة رسالة' : 'Schedule Message'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message-content">
              {dir === 'rtl' ? 'الرسالة' : 'Message'}
            </Label>
            <Input
              id="message-content"
              placeholder={dir === 'rtl' ? 'اكتب الرسالة...' : 'Type your message...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              dir={dir}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {dir === 'rtl' ? 'التاريخ' : 'Date'}
              </Label>
              <Input
                id="schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={today}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {dir === 'rtl' ? 'الوقت' : 'Time'}
              </Label>
              <Input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                min={date === today ? minTime : undefined}
              />
            </div>
          </div>

          {date && time && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {dir === 'rtl' ? 'سيتم إرسال الرسالة في:' : 'Message will be sent at:'}
              </p>
              <p className="font-medium">
                {format(new Date(`${date}T${time}`), dir === 'rtl' ? 'PPpp' : 'PPpp')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSchedule} disabled={!content.trim() || !date || !time}>
              {dir === 'rtl' ? 'جدولة' : 'Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

