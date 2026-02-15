import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Bell,
    Shield,
    User,
    Lock,
    Save,
    Loader2
} from "lucide-react";
import { useDetectionContext } from "@/store/DetectionContext";
import { useAuth } from "@/store/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const Settings = () => {
    const { account, currentProfile, updateProfile } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(currentProfile?.name || "");
    const [avatarUrl, setAvatarUrl] = useState(currentProfile?.avatar_url || "");
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

    // Sync state with currentProfile when it changes
    useEffect(() => {
        if (currentProfile) {
            setName(currentProfile.name);
            setAvatarUrl(currentProfile.avatar_url);
        }
    }, [currentProfile]);

    const handleSaveProfile = async () => {
        if (!currentProfile) return;
        setIsLoading(true);
        try {
            const { error } = await updateProfile(currentProfile.id, { name });
            if (error) throw error;
            toast({
                title: "Profile updated",
                description: "Your profile information has been saved.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateAvatar = async () => {
        if (!currentProfile) return;
        setIsLoading(true);
        try {
            const { error } = await updateProfile(currentProfile.id, { avatar_url: avatarUrl });
            if (error) throw error;
            toast({
                title: "Avatar updated",
                description: "Your profile picture has been updated.",
            });
            setIsAvatarDialogOpen(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update avatar.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-5xl mx-auto">
                <div>
                    <h2 className="text-3xl font-display font-bold">Settings</h2>
                    <p className="text-muted-foreground">Manage your account preferences and system configuration.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="system">System</TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="mt-6 space-y-6">
                        <section className="glass-card p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Personal Information
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={currentProfile?.avatar_url} />
                                        <AvatarFallback>{currentProfile?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>

                                    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">Change Avatar</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px] glass-card">
                                            <DialogHeader>
                                                <DialogTitle>Update Profile Picture</DialogTitle>
                                                <DialogDescription>
                                                    Enter the URL of the image you want to use as your avatar.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="avatarKey">Image URL</Label>
                                                    <Input
                                                        id="avatarKey"
                                                        value={avatarUrl}
                                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                                        placeholder="https://example.com/avatar.jpg"
                                                    />
                                                </div>
                                                <div className="flex justify-center">
                                                    <Avatar className="h-24 w-24">
                                                        <AvatarImage src={avatarUrl} />
                                                        <AvatarFallback>PRE</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleUpdateAvatar} disabled={isLoading}>
                                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Profile Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Account Email</Label>
                                        <Input id="email" value={account?.email || ""} disabled className="bg-muted" />
                                        <p className="text-xs text-muted-foreground">Managed by Account Owner</p>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                        <Lock className="w-4 h-4" /> Security
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        {currentProfile?.is_main ? (
                                            <Button variant="outline" className="w-full sm:w-auto">Change Account Password</Button>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Only the main account holder can change the password.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button onClick={handleSaveProfile} disabled={isLoading} className="gap-2">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </section>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="mt-6 space-y-6">
                        <section className="glass-card p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" /> Notification Preferences
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    {[
                                        { title: "Critical Alerts", desc: "Immediate notification for high-risk detections (Fire, Weapons).", checked: true },
                                        { title: "Email Summaries", desc: "Receive a daily summary of safety events.", checked: true },
                                        { title: "Push Notifications", desc: "Receive alerts on your mobile device.", checked: false },
                                        { title: "System Updates", desc: "Notifications about system maintenance and updates.", checked: true },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">{item.title}</Label>
                                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Switch defaultChecked={item.checked} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button className="gap-2">
                                    <Save className="w-4 h-4" /> Save Preferences
                                </Button>
                            </div>
                        </section>
                    </TabsContent>

                    {/* System Tab */}
                    <TabsContent value="system" className="mt-6 space-y-6">
                        <section className="glass-card p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" /> System Configuration
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Camera Auto-Discovery</Label>
                                            <p className="text-sm text-muted-foreground">Automatically detect new cameras on the network.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Data Retention</Label>
                                            <p className="text-sm text-muted-foreground">Keep detection logs for 30 days.</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Dark Mode Enforced</Label>
                                            <p className="text-sm text-muted-foreground">Force dark mode across all connected clients.</p>
                                        </div>
                                        <Switch defaultChecked={true} disabled />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border">
                                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-destructive">
                                        Danger Zone
                                    </h4>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 text-destructive">
                                            Clear All Logs
                                        </Button>
                                        <Button variant="destructive">
                                            Factory Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

const AlertSettingsBlock: React.FC = () => {
    const { alertConfig, setAlertConfig } = useDetectionContext();
    const [adminEnabled, setAdminEnabled] = useState<boolean>(alertConfig.enabled);
    const [adminEmail, setAdminEmail] = useState<string>(alertConfig.to);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setAdminEnabled(alertConfig.enabled);
        setAdminEmail(alertConfig.to);
    }, [alertConfig]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setAlertConfig({ enabled: adminEnabled, to: adminEmail });
        } catch (e) {
            console.debug('Failed to save alert settings', e);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleEnabled = async (checked: boolean) => {
        const prev = adminEnabled;
        setAdminEnabled(checked);
        setSaving(true);
        try {
            await setAlertConfig({ enabled: checked, to: adminEmail });
        } catch (e) {
            console.debug('Failed saving alert config (toggle)', e);
            setAdminEnabled(prev);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-2 flex items-center gap-2">
            <label className="text-sm">Email Alerts</label>
            <input
                type="checkbox"
                checked={adminEnabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="accent-green-400"
            />
            <Input
                className="ml-4 p-2 w-80"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="recipient@example.com"
            />
            <Button className={`ml-2`} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
            </Button>
        </div>
    );
};

export default Settings;
