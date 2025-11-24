'use client';

import { ScrollArea } from '@/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { User, Bell, Lock, Palette, MessageSquare, Crown, Globe } from 'lucide-react';
import { ProfileSettings } from './ProfileSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { ChatSettings } from './ChatSettings';
import { LanguageSettings } from './LanguageSettings';
import { User as UserType } from '@/types/chat';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsPageProps {
  currentUser: UserType;
  onUpdateUser: (updates: Partial<UserType>) => void;
}

export function SettingsPage({ currentUser, onUpdateUser }: SettingsPageProps) {
  const { t, dir } = useLanguage();

  return (
    <div className="flex-1 h-full" dir={dir}>
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: `hsl(var(--primary))` }} />
            <h1 className="text-xl sm:text-2xl font-bold" style={{
              color: `hsl(var(--primary))`
            }}>
              {t('settings.title')}
            </h1>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100dvh-73px)]" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div className="p-3 sm:p-4 md:p-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-2 overflow-x-auto scrollbar-hide" style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pinch-zoom'
            }}>
              <TabsTrigger value="profile" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.profile')}</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <Palette className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.appearance')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.notifications')}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.privacy')}</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.chat')}</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 min-h-[44px] touch-manipulation">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{t('settings.language')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4 sm:mt-6">
              <ProfileSettings currentUser={currentUser} onUpdateUser={onUpdateUser} />
            </TabsContent>

            <TabsContent value="appearance" className="mt-4 sm:mt-6">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="notifications" className="mt-4 sm:mt-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="privacy" className="mt-4 sm:mt-6">
              <PrivacySettings />
            </TabsContent>

            <TabsContent value="chat" className="mt-4 sm:mt-6">
              <ChatSettings />
            </TabsContent>

            <TabsContent value="language" className="mt-4 sm:mt-6">
              <LanguageSettings />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
