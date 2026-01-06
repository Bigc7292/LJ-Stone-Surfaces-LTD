import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

// --- KNOWLEDGE BASE ---
const KNOWLEDGE_BASE = {
    greetings: ["hello", "hi", "hey", "morning", "evening"],
    location: ["where", "location", "based", "address", "area", "wales", "aberdare"],
    products: ["material", "stone", "quartz", "granite", "dekton", "marble", "porcelain"],
    quote: ["price", "cost", "quote", "estimate", "expensive", "cheap"],
    process: ["process", "time", "long", "lead", "install", "template"],
    contact: ["phone", "email", "contact", "call", "number"],
};

// --- ANSWERS ---
const ANSWERS = {
    default: "I can help with quotes, material info (Quartz, Granite, Dekton), or booking a template. What do you need assistance with?",
    greeting: "Hello! Welcome to LJ Stone Surfaces. How can I help you transform your home today?",
    location: "We are based in Aberdare, South Wales. We serve the entire South Wales region and surrounding areas.",
    products: "We specialize in Quartz (Silestone, Caesarstone), Granite, and Dekton. We avoid standard Marble for kitchens due to durability issues.",
    quote: "To give you an accurate price, we need rough measurements or a kitchen plan. You can request a free quote by clicking the WhatsApp button.",
    process: "Our process: 1. Consultation & Estimate. 2. Laser Templating (onsite). 3. Fabrication. 4. Installation (usually 7-14 days after templating).",
    contact: "You can reach Jack directly via the WhatsApp button on this screen, or call us at +44 7727 310537.",
};

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
};

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: "Hi! I'm the LJ Stone Assistant. Ask me about our materials, lead times, or where we are based!",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // 1. User Message
        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        // 2. Bot Response Logic
        setTimeout(() => {
            const lowerInput = userMsg.text.toLowerCase();
            let botResponse = ANSWERS.default;

            if (KNOWLEDGE_BASE.greetings.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.greeting;
            else if (KNOWLEDGE_BASE.location.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.location;
            else if (KNOWLEDGE_BASE.products.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.products;
            else if (KNOWLEDGE_BASE.quote.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.quote;
            else if (KNOWLEDGE_BASE.process.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.process;
            else if (KNOWLEDGE_BASE.contact.some((k) => lowerInput.includes(k))) botResponse = ANSWERS.contact;

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: "bot",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSendMessage();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4 font-sans">

            {/* CHAT WINDOW */}
            {isOpen && !isMinimized && (
                <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl border bg-card text-card-foreground overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header - Uses Primary Brand Color */}
                    <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center font-bold">
                                AI
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">LJ Stone Support</h3>
                                <p className="text-[10px] opacity-90">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-background/20 text-primary-foreground"
                                onClick={() => setIsMinimized(true)}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-background/20 text-primary-foreground"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 bg-muted/30">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-muted-foreground border border-border rounded-tl-none"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-3 bg-card border-t">
                        <div className="flex items-center space-x-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type a message..."
                                className="bg-background"
                            />
                            <Button
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isTyping}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* FLOATING TOGGLE BUTTON - Uses Primary Brand Color */}
            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                    size="icon"
                >
                    <MessageCircle className="h-7 w-7" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                </Button>
            )}

            {/* MINIMIZED STATE BUBBLE */}
            {isOpen && isMinimized && (
                <Button
                    onClick={() => setIsMinimized(false)}
                    className="h-14 w-14 rounded-full shadow-xl"
                    variant="secondary"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            )}
        </div>
    );
}