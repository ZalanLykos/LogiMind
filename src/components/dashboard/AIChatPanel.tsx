import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Package, TrendingUp, Truck, DollarSign, Lightbulb, X, MessageCircle } from 'lucide-react';
import { 
  getInventoryStatus, 
  calculateKPIs, 
  aggregateByProduct,
  formatNumber, 
  formatCurrency,
  getStockoutEvents
} from '../../utils/dashboardUtils';
import type { DailyRecord } from '../../types';

interface AIChatPanelProps {
  records: DailyRecord[];
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const QUICK_QUESTIONS = [
  { id: 'low-stock', icon: Package, label: 'Show low stock items', query: 'What products have low inventory?' },
  { id: 'demand-prediction', icon: TrendingUp, label: 'Demand insights', query: 'Analyze demand trends' },
  { id: 'optimize-shipping', icon: Truck, label: 'Shipping optimization', query: 'How can we optimize shipping?' },
  { id: 'cost-analysis', icon: DollarSign, label: 'Cost analysis', query: 'Analyze our cost structure' },
];

export function AIChatPanel({ records }: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm your logistics AI assistant. I can help you analyze your data, predict demand, optimize shipping routes, and answer questions about your inventory and costs. What would you like to know?",
      timestamp: new Date(),
      suggestions: QUICK_QUESTIONS.map(q => q.query)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Hide badge when chat is opened
  useEffect(() => {
    if (isOpen) {
      setShowBadge(false);
    }
  }, [isOpen]);

  const generateAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Low stock analysis
    if (lowerQuery.includes('low stock') || lowerQuery.includes('inventory') || lowerQuery.includes('stockout')) {
      const inventory = getInventoryStatus(records);
      const lowStock = inventory.filter(i => i.inventory < 50);
      const criticalStock = inventory.filter(i => i.inventory === 0);
      
      if (criticalStock.length > 0) {
        return `⚠️ **CRITICAL STOCK ALERT**\n\n${criticalStock.map(i => `• ${i.product_name}: ${i.inventory} units (OUT OF STOCK)`).join('\n')}\n\n**Action Required:** Immediate restocking needed for critical items.`;
      }
      
      if (lowStock.length > 0) {
        return `📦 **Low Stock Items**\n\n${lowStock.map(i => `• ${i.product_name}: ${i.inventory} units remaining`).join('\n')}\n\n**Recommendation:** Consider increasing production or expediting shipments for these items.`;
      }
      
      return `✅ **Inventory Status: Good**\n\nAll products have adequate stock levels (50+ units). No immediate action required.`;
    }
    
    // Demand analysis
    if (lowerQuery.includes('demand') || lowerQuery.includes('trend')) {
      const productData = aggregateByProduct(records);
      const totalDemand = productData.reduce((sum, p) => sum + p.demand, 0);
      const topProducts = productData.sort((a, b) => b.demand - a.demand).slice(0, 3);
      
      return `📈 **Demand Analysis**\n\n**Total Demand:** ${formatNumber(totalDemand)} units\n\n**Top Products by Demand:**\n${topProducts.map((p, i) => `${i + 1}. ${p.product_name}: ${formatNumber(p.demand)} units`).join('\n')}\n\n**Insight:** ${topProducts[0]?.product_name || 'High-demand products'} are driving the majority of demand. Consider prioritizing production for these items.`;
    }
    
    // Shipping optimization
    if (lowerQuery.includes('shipping') || lowerQuery.includes('transport') || lowerQuery.includes('optimize')) {
      const transportData = records.reduce((acc, r) => {
        acc[r.transport_mode] = (acc[r.transport_mode] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const total = records.length;
      const airPercent = ((transportData['Air'] || 0) / total * 100).toFixed(1);
      const truckPercent = ((transportData['Truck'] || 0) / total * 100).toFixed(1);
      const shipPercent = ((transportData['Ship'] || 0) / total * 100).toFixed(1);
      
      return `🚚 **Shipping Analysis**\n\n**Current Distribution:**\n• Air (1-day): ${airPercent}% - Premium cost, fastest\n• Truck (3-day): ${truckPercent}% - Balanced option\n• Ship (7-day): ${shipPercent}% - Most economical\n\n**Optimization Suggestion:**\nConsider shifting non-urgent shipments from Air to Truck to reduce costs by approximately 15-20% while maintaining reasonable delivery times.`;
    }
    
    // Cost analysis
    if (lowerQuery.includes('cost') || lowerQuery.includes('profit') || lowerQuery.includes('margin')) {
      const kpis = calculateKPIs(records);
      const productData = aggregateByProduct(records);
      const profitByProduct = productData.map(p => ({
        name: p.product_name,
        profit: p.revenue - p.cost,
        margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0
      })).sort((a, b) => b.profit - a.profit);
      
      const topProfitable = profitByProduct.slice(0, 3);
      const lowMargin = profitByProduct.filter(p => p.margin < 15);
      
      return `💰 **Cost & Profitability Analysis**\n\n**Overall Metrics:**\n• Total Revenue: ${formatCurrency(kpis.totalRevenue)}\n• Total Cost: ${formatCurrency(kpis.totalCost)}\n• Net Profit: ${formatCurrency(kpis.totalRevenue - kpis.totalCost)}\n• Profit Margin: ${kpis.profitMargin.toFixed(1)}%\n\n**Most Profitable Products:**\n${topProfitable.map((p, i) => `${i + 1}. ${p.name}: ${formatCurrency(p.profit)} (${p.margin.toFixed(1)}% margin)`).join('\n')}\n\n${lowMargin.length > 0 ? `⚠️ **Low Margin Alert:** ${lowMargin.length} products have margins below 15%` : '✅ All products maintain healthy margins above 15%'}`;
    }
    
    // General analysis
    if (lowerQuery.includes('analysis') || lowerQuery.includes('overview') || lowerQuery.includes('summary')) {
      const kpis = calculateKPIs(records);
      const stockouts = getStockoutEvents(records);
      
      return `📊 **Logistics Overview**\n\n**Key Performance Indicators:**\n• Orders Processed: ${formatNumber(kpis.totalOrders)}\n• Fulfillment Rate: ${kpis.fulfillmentRate.toFixed(1)}%\n• Stockout Incidents: ${kpis.stockoutDays}\n• Average Cost/Unit: ${formatCurrency(kpis.avgCostPerUnit)}\n\n**Status:** ${kpis.fulfillmentRate >= 95 ? '✅ Excellent' : kpis.fulfillmentRate >= 90 ? '⚠️ Good' : '❌ Needs Improvement'}\n\n${stockouts.length > 0 ? `⚠️ Note: ${stockouts.length} stockout events detected. Review inventory management.` : '✅ No stockout issues detected.'}`;
    }
    
    // Default response
    return `🤖 I'm not sure I understand that question. Try asking me about:\n\n• Low stock items\n• Demand trends\n• Shipping optimization\n• Cost analysis\n• Overall performance\n\nOr click one of the quick question buttons below!`;
  };

  const handleSendMessage = (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking and typing
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(content.trim()),
        timestamp: new Date(),
        suggestions: QUICK_QUESTIONS.map(q => q.query)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleQuickQuestion = (query: string) => {
    handleSendMessage(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setShowBadge(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 group"
        >
          {/* Pulse animation ring */}
          <span className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
          
          {/* Main bubble */}
          <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          
          {/* Notification badge */}
          {showBadge && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
              AI
            </span>
          )}
          
          {/* Tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Ask AI Assistant
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-gray-900" />
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={handleClose}
          />
          
          {/* Chat Container */}
          <div className="relative w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">LogiMind AI</h3>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMessages([messages[0]])}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear conversation"
                >
                  <span className="text-xs">Clear</span>
                </button>
                <button 
                  onClick={handleClose}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-blue-500' : 'bg-white shadow-sm border border-gray-200'
                  }`}>
                    {message.type === 'user' ? (
                      <span className="text-xs font-medium text-white">You</span>
                    ) : (
                      <Bot className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className={`max-w-[75%] ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-line text-left ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                    }`}>
                      {message.content}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Quick questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuickQuestion(q.query)}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {q.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about inventory, demand, shipping..."
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
