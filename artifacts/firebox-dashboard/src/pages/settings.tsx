import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Key, Mail, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { useQueryClient } from '@tanstack/react-query';

const ME_QUERY_KEY = ['/api/auth/me'] as const;

type NotificationPreferences = {
  email: boolean;
  push: boolean;
  milestones: boolean;
};

const defaultNotifications: NotificationPreferences = {
  email: true,
  push: false,
  milestones: true,
};

async function readResponse(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof body?.error === 'string' ? body.error : 'We could not save your changes. Please try again.',
    );
  }
  return body;
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    try {
      const saved = localStorage.getItem(`firebox-notifications-${user.id}`);
      setNotifications(saved ? { ...defaultNotifications, ...JSON.parse(saved) } : defaultNotifications);
    } catch {
      setNotifications(defaultNotifications);
    }
  }, [user]);

  const updateNotifications = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    if (user) localStorage.setItem(`firebox-notifications-${user.id}`, JSON.stringify(next));
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const updatedUser = await readResponse(response);
      queryClient.setQueryData(ME_QUERY_KEY, updatedUser);
      toast({ title: 'Profile updated' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'We could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'The new passwords do not match.', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      await readResponse(response);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'We could not update your password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 pb-10 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, notifications, and password.</p>
      </motion.div>

      <div className="space-y-4">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-[5px] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile & Account</h2>
            <p className="text-sm text-muted-foreground mt-1">Your account details are loaded from your signed-in account.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Full name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="w-full bg-background border border-border rounded-[5px] h-11 px-4 text-foreground focus:outline-none focus:border-primary/50" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Email address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={user?.email ?? ''} readOnly className="w-full bg-background border border-border rounded-[5px] h-11 pl-10 pr-4 text-muted-foreground opacity-70" />
                </div>
              </label>
            </div>
            <Button onClick={saveProfile} disabled={isSavingProfile}>{isSavingProfile ? 'Saving…' : 'Save profile'}</Button>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-[5px] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">These preferences are saved separately for each account on this device.</p>
          </div>
          <div>
            {([
              ['email', 'Email notifications', 'Receive campaign summaries and alerts by email.'],
              ['milestones', 'Campaign milestones', 'Get notified when a campaign reaches its target.'],
              ['push', 'Browser notifications', 'Allow Firebox to show updates in your browser.'],
            ] as const).map(([key, title, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 p-6 border-b border-border/50 last:border-b-0">
                <div><h4 className="text-foreground font-medium">{title}</h4><p className="text-sm text-muted-foreground">{description}</p></div>
                <Switch checked={notifications[key]} onCheckedChange={(value) => updateNotifications(key, value)} className="data-[state=checked]:bg-primary" />
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-[5px] overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Security</h2>
            <p className="text-sm text-muted-foreground mt-1">Change the password used to protect this account.</p>
          </div>
          <div className="p-6 space-y-4">
            <label className="space-y-2 block"><span className="text-sm font-medium text-foreground">Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full bg-background border border-border rounded-[5px] h-11 px-4 text-foreground focus:outline-none focus:border-primary/50" /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-2"><span className="text-sm font-medium text-foreground">New password</span><input type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full bg-background border border-border rounded-[5px] h-11 px-4 text-foreground focus:outline-none focus:border-primary/50" /></label>
              <label className="space-y-2"><span className="text-sm font-medium text-foreground">Confirm new password</span><input type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-background border border-border rounded-[5px] h-11 px-4 text-foreground focus:outline-none focus:border-primary/50" /></label>
            </div>
            <Button onClick={changePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}><Key className="w-4 h-4" />{isChangingPassword ? 'Updating…' : 'Update password'}</Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
