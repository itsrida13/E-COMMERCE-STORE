import React, { useState, useEffect } from 'react';
import { getUsers, getOrders, getProducts } from '../services/api';
import { 
  Users, Search, ShoppingBag, DollarSign, 
  Calendar, CreditCard, Sparkles, User, 
  AlertCircle, ChevronRight, CheckCircle2,
  Clock, XCircle, Heart
} from 'lucide-react';

export default function Customers() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, orderRes, prodRes] = await Promise.all([
        getUsers(),
        getOrders(),
        getProducts()
      ]);
      setUsers(userRes.data || []);
      setOrders(orderRes.data || []);
      setProducts(prodRes.data || []);
      
      // Select the first customer by default if available
      if (userRes.data && userRes.data.length > 0) {
        setSelectedUser(userRes.data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch customer directory");
    } finally {
      setLoading(false);
    }
  };

  // Compile stats for each customer
  const customerStatsList = users.map(u => {
    // Link customer orders by userId or matching email
    const customerOrders = orders.filter(o => 
      (o.userId && (o.userId._id || o.userId).toString() === u._id.toString()) || 
      (o.email && o.email.toLowerCase() === u.email.toLowerCase())
    );

    const nonCancelledOrders = customerOrders.filter(o => o.orderStatus !== 'cancelled');

    // Aggregate spend
    const totalSpent = nonCancelledOrders.reduce((sum, o) => {
      let orderTotal = o.totalPrice || 0;
      return sum + orderTotal;
    }, 0);

    // Last order date
    let lastOrderDate = null;
    let daysSinceLastOrder = 999;
    if (nonCancelledOrders.length > 0) {
      const dates = nonCancelledOrders.map(o => new Date(o.createdAt || o.date));
      lastOrderDate = new Date(Math.max(...dates));
      const diffTime = Math.abs(new Date() - lastOrderDate);
      daysSinceLastOrder = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Preferred Payment Method
    const payments = {};
    nonCancelledOrders.forEach(o => {
      if (o.paymentMethod) {
        payments[o.paymentMethod] = (payments[o.paymentMethod] || 0) + 1;
      }
    });
    let preferredPaymentMethod = "None";
    let maxCount = 0;
    Object.entries(payments).forEach(([method, count]) => {
      if (count > maxCount) {
        preferredPaymentMethod = method;
        maxCount = count;
      }
    });

    // Preferred Categories purchased
    const categoryCounts = {};
    nonCancelledOrders.forEach(o => {
      const itemsList = o.orderItems && o.orderItems.length > 0 ? o.orderItems : o.items;
      itemsList?.forEach(item => {
        const targetProdId = item.productId?._id || item.productId || item.product?._id || item.product;
        const prod = products.find(p => p._id.toString() === targetProdId?.toString());
        if (prod && prod.category) {
          categoryCounts[prod.category] = (categoryCounts[prod.category] || 0) + Number(item.quantity || 1);
        }
      });
    });

    // AI Customer Insights Logic
    const aiInsights = [];
    
    // Rule 1: Frequently buys eye makeup
    const eyeCount = categoryCounts['Eyes'] || categoryCounts['eye makeup'] || 0;
    if (eyeCount > 1) {
      aiInsights.push("This customer frequently buys eye makeup products.");
    }

    // Rule 2: Cash on Delivery Preference
    const isCod = preferredPaymentMethod?.toLowerCase().includes("cod") || 
                  preferredPaymentMethod?.toLowerCase().includes("cash") || 
                  preferredPaymentMethod?.toLowerCase().includes("delivery");
    if (isCod) {
      aiInsights.push("This customer prefers Cash on Delivery.");
    }

    // Rule 3: Idle days trigger
    if (daysSinceLastOrder > 45 && lastOrderDate !== null) {
      aiInsights.push(`This customer has not ordered in ${daysSinceLastOrder} days.`);
      aiInsights.push("Recommend sending a 10% discount coupon.");
    }

    // Rule 4: High probability purchase trigger
    if (nonCancelledOrders.length >= 2 && daysSinceLastOrder <= 30) {
      aiInsights.push("This customer is likely to buy again based on order frequency.");
    }

    // Fallbacks if no matching traits
    if (nonCancelledOrders.length === 0) {
      aiInsights.push("New customer profile. Recommend sending a welcome 5% discount coupon.");
    } else if (aiInsights.length === 0) {
      aiInsights.push("Regular beauty browser. Keep engaged with active recommendations.");
    }

    return {
      user: u,
      orders: customerOrders,
      nonCancelledOrdersCount: nonCancelledOrders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      lastOrderDate,
      daysSinceLastOrder,
      preferredPaymentMethod,
      categoryCounts,
      aiInsights
    };
  });

  const filteredStats = customerStatsList.filter(item => 
    item.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStats = customerStatsList.find(item => selectedUser && item.user._id === selectedUser._id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Synchronizing customer index...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-center max-w-lg mx-auto mt-10">
        <AlertCircle size={32} className="mx-auto mb-3" />
        <h3 className="text-lg font-bold mb-2">CRM Directory Error</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
          <Users className="text-pink-600" size={28} />
          Customer Relationship Management (CRM)
        </h1>
        <p className="text-gray-500 mt-1">Live customer accounts, AI behavioral insights, and complete order history tracker.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Directory & List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by customer name or email address..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm outline-none border-none text-gray-700 bg-transparent placeholder-gray-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold text-center">Orders</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Spent</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStats.map((item) => (
                    <tr 
                      key={item.user._id} 
                      onClick={() => setSelectedUser(item.user)}
                      className={`hover:bg-pink-50/30 transition-colors cursor-pointer ${selectedUser && selectedUser._id === item.user._id ? 'bg-pink-50/50 font-medium' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold capitalize">
                            {item.user.name?.slice(0, 1)}
                          </div>
                          <div>
                            <p className="text-gray-900 font-semibold capitalize">{item.user.name}</p>
                            <p className="text-xs text-gray-400">{item.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold capitalize ${item.user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {item.user.role || 'customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600 font-semibold">{item.nonCancelledOrdersCount}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">${item.totalSpent}</td>
                      <td className="px-6 py-4 text-right text-pink-600">
                        <ChevronRight size={18} className="ml-auto" />
                      </td>
                    </tr>
                  ))}

                  {filteredStats.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No customers match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Customer Detailed Profile & AI Insights */}
        {selectedStats ? (
          <div className="space-y-6">
            {/* Main CRM Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                <div className="w-14 h-14 rounded-full bg-pink-600 flex items-center justify-center text-white text-2xl font-bold capitalize">
                  {selectedStats.user.name?.slice(0, 1)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 capitalize">{selectedStats.user.name}</h3>
                  <p className="text-sm text-gray-400">{selectedStats.user.email}</p>
                  <p className="text-xs text-pink-600 font-semibold mt-1 capitalize">Member since: {new Date(selectedStats.user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium">Total Revenue</p>
                  <p className="text-lg font-bold text-green-600 mt-1">${selectedStats.totalSpent}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium">Non-Cancelled Orders</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">{selectedStats.nonCancelledOrdersCount}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium">Payment preference</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1.5 truncate capitalize">{selectedStats.preferredPaymentMethod}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium">Last active</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1.5 truncate">
                    {selectedStats.lastOrderDate ? selectedStats.lastOrderDate.toLocaleDateString() : 'Never ordered'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Customer Insights Card */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl shadow-md p-6 space-y-4 relative overflow-hidden">
              <div className="absolute right-[-20px] bottom-[-20px] text-pink-400 opacity-20 transform rotate-12">
                <Sparkles size={120} />
              </div>
              
              <div className="flex items-center gap-2 border-b border-pink-400/40 pb-3">
                <Sparkles size={20} className="text-pink-100" />
                <h3 className="text-lg font-bold">AI Customer Insights</h3>
              </div>

              <div className="space-y-3 relative z-10">
                {selectedStats.aiInsights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <CheckCircle2 size={16} className="text-pink-200 mt-0.5 shrink-0" />
                    <p className="text-pink-50 leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500 shadow-sm">
            Please register at least one customer to view analytics.
          </div>
        )}
      </div>

      {/* Customer Order History Section */}
      {selectedStats && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="text-pink-600" size={20} />
              Order History Profile ({selectedStats.user.name})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Order Date</th>
                  <th className="px-6 py-4 font-semibold">Products Ordered</th>
                  <th className="px-6 py-4 font-semibold">Payment Method</th>
                  <th className="px-6 py-4 font-semibold">Payment Status</th>
                  <th className="px-6 py-4 font-semibold">Order Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedStats.orders.map((order) => {
                  const itemsList = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.items;
                  
                  return (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800 select-all font-mono text-xs">{order._id}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(order.createdAt || order.date).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <div className="space-y-1">
                          {itemsList?.map((item, idx) => {
                            const pId = item.productId || item.product;
                            const prodName = item.name || products.find(p => p._id.toString() === (pId?._id || pId)?.toString())?.name || "Product Item";
                            return (
                              <div key={idx} className="flex justify-between items-center bg-gray-50 px-2.5 py-1 rounded text-xs border border-gray-100">
                                <span className="font-medium text-gray-700 truncate mr-2">{prodName}</span>
                                <span className="text-pink-600 font-bold font-mono">x{item.quantity || 1}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{order.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-semibold capitalize ${
                          order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {order.paymentStatus?.toLowerCase() === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full font-semibold capitalize ${
                          order.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.orderStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.orderStatus?.toLowerCase() === 'delivered' ? <CheckCircle2 size={12} /> : 
                           order.orderStatus?.toLowerCase() === 'cancelled' ? <XCircle size={12} /> : 
                           <Clock size={12} />}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">${order.totalPrice}</td>
                    </tr>
                  );
                })}

                {selectedStats.orders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No order transactions exist for this customer yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
