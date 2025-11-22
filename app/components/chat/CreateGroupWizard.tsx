'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { ScrollArea } from '@/ui/scroll-area';
import { Check, X, Users, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@/types/chat';
import { cn } from '@/lib/utils';

interface CreateGroupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: User[];
  onCreateGroup: (name: string, description: string, memberIds: string[]) => void;
}

export function CreateGroupWizard({
  isOpen,
  onClose,
  contacts,
  onCreateGroup
}: CreateGroupWizardProps) {
  const { dir } = useLanguage();
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber?.includes(searchQuery)
  );

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleNext = () => {
    if (step === 1 && selectedMembers.size >= 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleCreate = () => {
    if (groupName.trim() && selectedMembers.size >= 1) {
      onCreateGroup(
        groupName.trim(),
        groupDescription.trim(),
        Array.from(selectedMembers)
      );
      // Reset form
      setStep(1);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers(new Set());
      setSearchQuery('');
      onClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setGroupDescription('');
    setSelectedMembers(new Set());
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {dir === 'rtl' ? 'إنشاء مجموعة جديدة' : 'Create New Group'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (dir === 'rtl' ? 'اختر الأعضاء' : 'Select members')
              : (dir === 'rtl' ? 'أدخل معلومات المجموعة' : 'Enter group information')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {step === 1 ? (
            <>
              <div className="relative">
                <Search className={`absolute ${dir === 'rtl' ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  placeholder={dir === 'rtl' ? 'ابحث عن جهات الاتصال...' : 'Search contacts...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
                  dir={dir}
                />
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2">
                  {filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>{dir === 'rtl' ? 'لا توجد جهات اتصال' : 'No contacts found'}</p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = selectedMembers.has(contact.id);
                      return (
                        <div
                          key={contact.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                            isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                          )}
                          onClick={() => handleToggleMember(contact.id)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={contact.avatar} />
                            <AvatarFallback>{contact.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.name}</p>
                            {contact.phoneNumber && (
                              <p className="text-sm text-muted-foreground truncate">{contact.phoneNumber}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedMembers.size} {dir === 'rtl' ? 'محدد' : 'selected'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button onClick={handleNext} disabled={selectedMembers.size < 1}>
                    {dir === 'rtl' ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">
                    {dir === 'rtl' ? 'اسم المجموعة' : 'Group Name'} *
                  </Label>
                  <Input
                    id="group-name"
                    placeholder={dir === 'rtl' ? 'أدخل اسم المجموعة...' : 'Enter group name...'}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    dir={dir}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-description">
                    {dir === 'rtl' ? 'وصف المجموعة (اختياري)' : 'Group Description (Optional)'}
                  </Label>
                  <Input
                    id="group-description"
                    placeholder={dir === 'rtl' ? 'أدخل وصف المجموعة...' : 'Enter group description...'}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    dir={dir}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {dir === 'rtl' ? 'الأعضاء المحددون' : 'Selected Members'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedMembers).map((memberId) => {
                      const member = contacts.find(c => c.id === memberId);
                      if (!member) return null;
                      return (
                        <div
                          key={memberId}
                          className="flex items-center gap-2 px-2 py-1 bg-background rounded-full"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{member.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={handleBack}>
                  {dir === 'rtl' ? 'رجوع' : 'Back'}
                </Button>
                <Button onClick={handleCreate} disabled={!groupName.trim()}>
                  {dir === 'rtl' ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

