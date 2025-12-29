import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2, Minus, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface Message {
    role: "user" | "model";
    content: string;
}

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "model", content: "Hello! I am your LJ Stone Surfaces Assistant. How can I help you with your project today?" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isMinimized]);

    const mutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await apiRequest("POST", "/api/ai/chat", {
                message,
                history: messages.slice(1), // Exclude the initial greeting from history if needed, or pass all
            });
            return res.json();
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: "model", content: data.response }]);
        },
    });

    const handleSend = () => {
        if (!input.trim() || mutation.isPending) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setInput("");
        mutation.mutate(userMessage);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? "80px" : "500px",
                            width: "350px"
                        }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="mb-4 overflow-hidden"
                    >
                        <Card className="h-full border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col border-b-4 border-b-primary shadow-primary/10">
                            <CardHeader className="p-4 bg-primary/10 border-b border-primary/20 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-serif flex items-center gap-2 tracking-widest uppercase">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    Stone Assistant
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/20"
                                        onClick={() => setIsMinimized(!isMinimized)}
                                    >
                                        {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-primary/20"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X size={14} />
                                    </Button>
                                </div>
                            </CardHeader>

                            {!isMinimized && (
                                <>
                                    <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                                        <div
                                            ref={scrollRef}
                                            className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20"
                                        >
                                            <div className="space-y-4">
                                                {messages.map((msg, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === "user"
                                                                    ? "bg-primary text-black font-medium rounded-br-none"
                                                                    : "bg-secondary/40 border border-white/5 rounded-bl-none text-foreground/90"
                                                                }`}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                ))}
                                                {mutation.isPending && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-secondary/40 border border-white/5 rounded-lg rounded-bl-none p-3">
                                                            <Loader2 size={16} className="animate-spin text-primary" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 bg-secondary/20 border-t border-primary/10 flex gap-2">
                                            <Input
                                                placeholder="Ask about materials, pricing..."
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                                className="bg-background/50 border-white/10 focus-visible:ring-primary/50"
                                            />
                                            <Button
                                                size="icon"
                                                onClick={handleSend}
                                                disabled={mutation.isPending || !input.trim()}
                                                className="bg-primary text-black hover:bg-white shrink-0"
                                            >
                                                <Send size={16} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    size="icon"
                    className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${isOpen ? "bg-background border-primary/50 text-primary" : "bg-primary text-black"
                        }`}
                    onClick={() => {
                        setIsOpen(true);
                        setIsMinimized(false);
                    }}
                >
                    <MessageSquare size={24} />
                </Button>
            </motion.div>
        </div>
    );
}
