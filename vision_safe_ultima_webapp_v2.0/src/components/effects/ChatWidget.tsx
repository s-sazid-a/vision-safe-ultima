import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoMessages = [
    {
        role: "bot",
        content: "Hello! I'm the VISION SAFE AI assistant. How can I help you today?",
    },
    {
        role: "user",
        content: "What features does VISION SAFE offer?",
    },
    {
        role: "bot",
        content: "VISION SAFE offers real-time video monitoring with AI-powered detection for:\n\n• Fall detection & pose analysis\n• Fire and smoke detection\n• Intrusion alerts\n• Activity monitoring\n• Risk fusion engine with instant alerts\n\nWould you like to know more about any specific feature?",
    },
];

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(demoMessages);
    const [inputValue, setInputValue] = useState("");

    const handleSend = () => {
        if (!inputValue.trim()) return;

        setMessages([
            ...messages,
            { role: "user", content: inputValue },
            {
                role: "bot",
                content: "Thanks for your question! This is a demo interface. Sign up to get full access to our AI assistant that can answer all your questions about VISION SAFE.",
            },
        ]);
        setInputValue("");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-[360px] h-[500px] glass-card rounded-2xl overflow-hidden flex flex-col shadow-2xl bg-black/80 backdrop-blur-xl border border-white/10"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-accent/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-primary-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-semibold text-sm">VISION SAFE AI</h3>
                                        <p className="text-xs text-muted-foreground">Always here to help</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 hover:bg-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "bot"
                                                ? "bg-gradient-to-r from-primary to-accent"
                                                : "bg-muted"
                                            }`}
                                    >
                                        {message.role === "bot" ? (
                                            <Bot className="w-4 h-4 text-primary-foreground" />
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[70%] p-3 rounded-2xl text-sm ${message.role === "bot"
                                                ? "bg-muted rounded-tl-none"
                                                : "bg-primary text-primary-foreground rounded-tr-none"
                                            }`}
                                    >
                                        <p className="whitespace-pre-line">{message.content}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                                />
                                <Button
                                    onClick={handleSend}
                                    size="icon"
                                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        key="button"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse"
                    >
                        <MessageCircle className="w-6 h-6 text-primary-foreground" />

                        {/* Notification dot */}
                        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-bounce" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatWidget;
