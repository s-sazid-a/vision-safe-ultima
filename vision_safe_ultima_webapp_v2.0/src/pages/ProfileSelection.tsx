import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/store/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfileSelection = () => {
    const { account, selectProfile, addProfile } = useAuth();
    const navigate = useNavigate();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newProfileName, setNewProfileName] = useState("");

    const handleSelect = (profileId: string) => {
        selectProfile(profileId);
        navigate("/dashboard");
    };

    const handleAddProfile = async () => {
        if (!newProfileName.trim()) return;

        await addProfile(newProfileName);
        setIsAddOpen(false);
        setNewProfileName("");
    };

    if (!account) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-4xl text-center">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-display font-bold mb-12"
                >
                    Who is monitoring?
                </motion.h1>

                <div className="flex flex-wrap justify-center gap-8">
                    {account.profiles.map((profile, index) => (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            className={`group flex flex-col items-center gap-4 cursor-pointer`}
                            onClick={() => {
                                handleSelect(profile.id);
                            }}
                        >
                            <div className={`relative w-32 h-32 md:w-40 md:h-40 rounded-md overflow-hidden border-4 transition-all border-transparent group-hover:border-primary`}>
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>
                            <span className="text-xl text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                                {profile.name}
                            </span>
                        </motion.div>
                    ))}

                    {account.profiles.length < 4 && (
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: account.profiles.length * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="group flex flex-col items-center gap-4 cursor-pointer"
                                >
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-muted/20 border-2 border-transparent group-hover:border-primary flex items-center justify-center transition-all">
                                        <Plus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <span className="text-xl text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                                        Add Profile
                                    </span>
                                </motion.div>
                            </DialogTrigger>
                            <DialogContent className="glass-card sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add Profile</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={newProfileName}
                                            onChange={(e) => setNewProfileName(e.target.value)}
                                            className="col-span-3"
                                            placeholder="Profile Name"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddProfile}>Create Profile</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="mt-16">
                    <Button variant="outline" className="gap-2 text-muted-foreground hover:text-foreground">
                        Manage Profiles
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSelection;
