import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Bell, Shield, Key, Moon, Laptop, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    milestones: true,
    marketing: false
  });

  const handleSave = () => {
    toast({ title: 'Settings saved successfully' });
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and notifications.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Settings Navigation (Desktop only visual representation) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="hidden md:flex flex-col gap-2"
        >
          <button className="flex items-center gap-3 px-4 py-3 bg-card border border-primary/30 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(255,106,0,0.1)] outline-none text-left">
            <User className="w-5 h-5 text-primary" />
            Profile & Account
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white hover:bg-secondary/50 rounded-xl font-medium transition-colors outline-none text-left">
            <Bell className="w-5 h-5" />
            Notifications
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-white hover:bg-secondary/50 rounded-xl font-medium transition-colors outline-none text-left">
            <Shield className="w-5 h-5" />
            Security
          </button>
        </motion.div>

        {/* Settings Content */}
        <div className="space-y-8">
          
          {/* Profile Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-card border border-border rounded-[20px] overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
              <p className="text-sm text-muted-foreground mt-1">Your personal details and public profile.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-secondary border-2 border-border flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <Button variant="outline" className="bg-secondary text-white hover:bg-secondary/80 border-0 h-9">
                    Upload Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="Firebox User" 
                    className="w-full bg-[#0B0B0B] border border-border rounded-lg h-11 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      defaultValue="user@firebox.app" 
                      readOnly
                      className="w-full bg-[#0B0B0B] border border-border rounded-lg h-11 pl-10 pr-4 text-muted-foreground opacity-70 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-card border border-border rounded-[20px] overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">Control how and when you want to be notified.</p>
            </div>
            <div className="p-0">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="space-y-0.5">
                  <h4 className="text-white font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive daily summaries and alerts via email.</p>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(c) => setNotifications(prev => ({...prev, email: c}))} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="space-y-0.5">
                  <h4 className="text-white font-medium">Campaign Milestones</h4>
                  <p className="text-sm text-muted-foreground">Get notified when a campaign hits 50% and 100% of target.</p>
                </div>
                <Switch 
                  checked={notifications.milestones} 
                  onCheckedChange={(c) => setNotifications(prev => ({...prev, milestones: c}))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div className="space-y-0.5">
                  <h4 className="text-white font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications for real-time updates.</p>
                </div>
                <Switch 
                  checked={notifications.push} 
                  onCheckedChange={(c) => setNotifications(prev => ({...prev, push: c}))}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </motion.section>

          {/* Appearance Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-card border border-border rounded-[20px] overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">Appearance</h2>
              <p className="text-sm text-muted-foreground mt-1">Customize how Firebox looks on your device.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border-2 border-primary bg-primary/5 rounded-xl p-4 flex items-center gap-4 cursor-pointer relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#0B0B0B] border border-border flex items-center justify-center">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Dark Mode</h4>
                    <p className="text-xs text-primary font-medium">Active Theme</p>
                  </div>
                </div>
                
                <div className="border-2 border-transparent bg-[#0B0B0B] border-border rounded-xl p-4 flex items-center gap-4 cursor-not-allowed opacity-50 relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <Laptop className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">System Default</h4>
                    <p className="text-xs text-muted-foreground">Dark mode locked</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 shadow-[0_0_15px_rgba(255,106,0,0.2)]"
            >
              Save Preferences
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}