'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Badge } from '@/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Textarea } from '@/ui/textarea';
import { 
  Users, 
  Search, 
  Crown, 
  Gift, 
  X,
  UserCheck,
  UserX,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string;
  email: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  hasFreeSubscription: boolean;
  freeSubscription?: {
    id: string;
    expiresAt: string | null;
    reason: string;
  } | null;
}

export function UsersManager() {
  const { dir } = useLanguage();
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [grantReason, setGrantReason] = useState('');
  const [grantExpiresAt, setGrantExpiresAt] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
    if (!adminUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users?adminId=${adminUser.id}&page=${page}&limit=20&search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantFreeSubscription = async () => {
    if (!adminUser || !selectedUser) return;

    try {
      const response = await fetch('/api/admin/grant-free-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser.id,
          userId: selectedUser.id,
          reason: grantReason,
          expiresAt: grantExpiresAt || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(dir === 'rtl' ? 'تم منح الاشتراك المجاني بنجاح' : 'Free subscription granted successfully');
          setShowGrantDialog(false);
          setSelectedUser(null);
          setGrantReason('');
          setGrantExpiresAt('');
          loadUsers();
        }
      } else {
        const data = await response.json();
        alert(data.message || (dir === 'rtl' ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Error granting free subscription:', error);
      alert(dir === 'rtl' ? 'حدث خطأ في الخادم' : 'Server error');
    }
  };

  const handleRevokeFreeSubscription = async (userId: string) => {
    if (!adminUser) return;

    if (!confirm(dir === 'rtl' ? 'هل أنت متأكد من إلغاء الاشتراك المجاني؟' : 'Are you sure you want to revoke free subscription?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/revoke-free-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminUser.id,
          userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(dir === 'rtl' ? 'تم إلغاء الاشتراك المجاني بنجاح' : 'Free subscription revoked successfully');
          loadUsers();
        }
      } else {
        const data = await response.json();
        alert(data.message || (dir === 'rtl' ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Error revoking free subscription:', error);
      alert(dir === 'rtl' ? 'حدث خطأ في الخادم' : 'Server error');
    }
  };

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {dir === 'rtl' ? 'إدارة المستخدمين' : 'Users Management'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dir === 'rtl' 
              ? 'إدارة المستخدمين ومنح الاشتراك المجاني'
              : 'Manage users and grant free subscriptions'}
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {dir === 'rtl' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute ${dir === 'rtl' ? 'right' : 'left'}-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
        <Input
          placeholder={dir === 'rtl' ? 'بحث عن مستخدم...' : 'Search for user...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className={dir === 'rtl' ? 'pr-10' : 'pl-10'}
          dir={dir}
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {dir === 'rtl' ? 'لا يوجد مستخدمين' : 'No users found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-16 h-16 border-2 border-primary/30">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{user.name}</h4>
                        {user.isVerified && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                            {dir === 'rtl' ? 'موثق' : 'Verified'}
                          </Badge>
                        )}
                        {user.hasFreeSubscription && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                            <Crown className="w-3 h-3 mr-1" />
                            {dir === 'rtl' ? 'اشتراك مجاني' : 'Free Subscription'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                      {user.hasFreeSubscription && user.freeSubscription && (
                        <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            {dir === 'rtl' ? 'السبب: ' : 'Reason: '}{user.freeSubscription.reason || (dir === 'rtl' ? 'لا يوجد' : 'None')}
                          </p>
                          {user.freeSubscription.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              {dir === 'rtl' ? 'ينتهي في: ' : 'Expires: '}{new Date(user.freeSubscription.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                          {!user.freeSubscription.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              {dir === 'rtl' ? 'مدى الحياة' : 'Lifetime'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!user.hasFreeSubscription ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowGrantDialog(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        {dir === 'rtl' ? 'منح مجاني' : 'Grant Free'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeFreeSubscription(user.id)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        {dir === 'rtl' ? 'إلغاء' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {dir === 'rtl' ? 'السابق' : 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {dir === 'rtl' ? 'صفحة' : 'Page'} {page} {dir === 'rtl' ? 'من' : 'of'} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {dir === 'rtl' ? 'التالي' : 'Next'}
          </Button>
        </div>
      )}

      {/* Grant Free Subscription Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="max-w-md" dir={dir}>
          <DialogHeader>
            <DialogTitle>{dir === 'rtl' ? 'منح الاشتراك المجاني' : 'Grant Free Subscription'}</DialogTitle>
            <DialogDescription>
              {dir === 'rtl' 
                ? `منح الاشتراك المجاني لـ ${selectedUser?.name}`
                : `Grant free subscription to ${selectedUser?.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{dir === 'rtl' ? 'السبب (اختياري)' : 'Reason (Optional)'}</Label>
              <Textarea
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder={dir === 'rtl' ? 'أدخل سبب منح الاشتراك المجاني' : 'Enter reason for granting free subscription'}
                rows={3}
                dir={dir}
              />
            </div>
            <div className="space-y-2">
              <Label>{dir === 'rtl' ? 'تاريخ الانتهاء (اختياري - اتركه فارغاً للاشتراك مدى الحياة)' : 'Expiration Date (Optional - Leave empty for lifetime)'}</Label>
              <Input
                type="datetime-local"
                value={grantExpiresAt}
                onChange={(e) => setGrantExpiresAt(e.target.value)}
                dir={dir}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowGrantDialog(false);
                setSelectedUser(null);
                setGrantReason('');
                setGrantExpiresAt('');
              }}>
                {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleGrantFreeSubscription} className="bg-yellow-500 hover:bg-yellow-600">
                <Gift className="w-4 h-4 mr-2" />
                {dir === 'rtl' ? 'منح' : 'Grant'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

