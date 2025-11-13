import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! 👋 Welcome to POD N BEYOND. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickReplies = [
    { text: "Check Room Availability", value: "availability" },
    { text: "View Our Properties", value: "properties" },
    { text: "Pricing Information", value: "pricing" },
    { text: "Contact Details", value: "contact" }
  ];

  const getBotResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.includes('avail') || lowerMsg.includes('book')) {
      return "You can check room availability by scrolling up to our booking form. Select your dates and location to see available rooms across our 3 properties! 🏨";
    } else if (lowerMsg.includes('propert') || lowerMsg.includes('location')) {
      return "We have 3 properties in Jamshedpur:\n\n📍 Capsule Pod Hotel - Kasidih\n📍 Pod n Beyond Smart Hotel - Bistupur\n📍 Pod n Beyond Smart Hotel - Sakchi (Flagship)\n\nAll properties offer modern amenities and comfortable pods!";
    } else if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('rate')) {
      return "Our pod rates range from ₹999/night (Capsule Pod) to ₹3,699/night (King Pod). Prices vary by location and pod type. Use the search form above to get exact pricing for your dates! 💰";
    } else if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('email')) {
      return "📞 Phone: +91-90310 00931\n📧 Email: info@podnbeyond.com\n📍 Address: Bistupur, Jamshedpur\n\nFeel free to reach out anytime!";
    } else if (lowerMsg.includes('amenities') || lowerMsg.includes('facilities')) {
      return "Our amenities include:\n✅ Free WiFi\n✅ Hot Breakfast\n✅ Self-Service Laundry\n✅ E-Library\n✅ Game Zones\n✅ 24/7 Check-in\n\nAnd much more! Each property has unique features.";
    } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      return "Hello! 👋 Welcome to POD N BEYOND - India's First Pod Hotel! How can I assist you today?";
    } else if (lowerMsg.includes('thank')) {
      return "You're welcome! Happy to help. Feel free to ask anything else! 😊";
    } else {
      return "I can help you with:\n• Room availability & booking\n• Our 3 property locations\n• Pricing information\n• Amenities & facilities\n• Contact details\n\nWhat would you like to know?";
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot typing and response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const handleQuickReply = (value: string) => {
    const quickReplyTexts: { [key: string]: string } = {
      availability: "Check Room Availability",
      properties: "Tell me about your properties",
      pricing: "What are your room rates?",
      contact: "How can I contact you?"
    };

    setInputValue(quickReplyTexts[value] || value);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="relative">
      {/* Chat Widget - Closed State */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center z-50 animate-bounce"
        >
          <span className="text-2xl">💬</span>
        </button>
      )}

      {/* Chat Widget - Open State */}
      {isOpen && (
        <div className="bg-gray-800 rounded-lg shadow-2xl h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold">POD N BEYOND Assistant</h3>
                <p className="text-xs text-blue-100">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-700">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="p-3 bg-gray-700 border-t border-gray-600">
              <p className="text-xs text-gray-400 mb-2">Quick replies:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.value}
                    onClick={() => handleQuickReply(reply.value)}
                    className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-gray-800 border-t border-gray-600 rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;

