'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Label } from '@/ui/label';
import { Switch } from '@/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Clock, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DisappearingMessagesSettingsProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  currentTimer?: number; // in seconds
  onSave: (timer: number | null) => void;
}

const TIMER_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 3600, label: '1 hour' },
  { value: 86400, label: '24 hours' },
  { value: 604800, label: '7 days' },
  { value: 2592000, label: '30 days' }
];

const TIMER_OPTIONS_AR = [
  { value: 0, label: 'إيقاف' },
  { value: 3600, label: 'ساعة واحدة' },
  { value: 86400, label: '24 ساعة' },
  { value: 604800, label: '7 أيام' },
  { value: 2592000, label: '30 يوم' }
];

export function DisappearingMessagesSettings({
  conversationId,
  isOpen,
  onClose,
  currentTimer = 0,
  onSave
}: DisappearingMessagesSettingsProps) {
  const { dir } = useLanguage();
  const [enabled, setEnabled] = useState(currentTimer > 0);
  const [timer, setTimer] = useState(currentTimer || 86400);
  const options = dir === 'rtl' ? TIMER_OPTIONS_AR : TIMER_OPTIONS;

  const handleSave = () => {
    onSave(enabled ? timer : null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {dir === 'rtl' ? 'رسائل تختفي تلقائياً' : 'Disappearing Messages'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-disappearing">
                {dir === 'rtl' ? 'تفعيل الرسائل التي تختفي' : 'Enable Disappearing Messages'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {dir === 'rtl' 
                  ? 'الرسائل الجديدة في هذه المحادثة ستختفي تلقائياً بعد الوقت المحدد'
                  : 'New messages in this chat will disappear automatically after the selected time'}
              </p>
            </div>
            <Switch
              id="enable-disappearing"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="timer">
                {dir === 'rtl' ? 'مدة الاختفاء' : 'Disappear After'}
              </Label>
              <Select
                value={timer.toString()}
                onValueChange={(value) => setTimer(parseInt(value))}
              >
                <SelectTrigger id="timer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave}>
              {dir === 'rtl' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

