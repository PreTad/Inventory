import React, { useEffect, useState } from 'react';
import { 
  Package, DollarSign, AlertTriangle, TrendingUp, Plus ,Loader2,LineChartIcon
} from 'lucide-react';
// Import Recharts components
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import axios from 'axios';
import { AiOutlineClose } from 'react-icons/ai'; 

const API = import.meta.env.VITE_API_URL

function Dashboard() {

  const [stats,setStats]  = useState({
    total_items : 0,
    inventory_value : 0,
    low_stocks : 0,
    stock : [],
    stock_value : [],
    low_stocks_ : []
  });
  const [formData, setFormData] = useState({
          name : '',
          category : '',
          cost_price : '',
          unit_price : '',
          quantity : '',
          description : '',
          product_image : '',
      });
  const [openDialogue, setOpenDialogue] = useState(false);
  const [loading, setLoading] = useState(true);
  // Data for Monthly Sales/Restock Trends
  const trendData = [
    { month: 'Jan', added: 40, sold: 24 },
    { month: 'Feb', added: 30, sold: 13 },
    { month: 'Mar', added: 20, sold: 98 },
    { month: 'Apr', added: 27, sold: 39 },
  ];

    const handleChange = (e) => {
        const { name, value, files, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };
    const handleDialogue = () =>{
        setOpenDialogue(true);
    }

  const handleSubmit = async(e) => {
          try{
              const data = new FormData()
              data.append('name', formData.name);
              data.append('category', formData.category);
              data.append('cost_price', formData.cost_price);
              data.append('unit_price', formData.unit_price);
              data.append('quantity', formData.quantity);
              data.append('description', formData.description);
  
              if (formData.product_image) {
                  data.append('product_image', formData.product_image);
              }
              await axios.post(`${API}/api/products/`,data,{
                  headers : {
                      'Content-Type': 'multipart/form-data',
                  }
              }
              );
              alert("Successfully added!")
              setFormData({
                  name : '',
                  category : '',
                  cost_price : '',
                  unit_price : '',
                  quantity : '',
                  description : '',
                  product_image : '',
              });
  
              setOpenDialogue(false);
              fetchStats();
              // fetchReports()
          }catch(err){
              const message = err.response?.data
              ? JSON.stringify(err.response.data)
              : "Something is wrong!";
               alert(message);
          }
      }

  const fetchStats = async () =>{
      try{
      const response = await axios.get(
        `${API}/api/inventorystats/`
      )

      setStats(response.data);
      setLoading(false);
    }catch(err){
      // alert(err);
      setLoading(false);
    }
    }
  useEffect(() => {
    fetchStats();
  },[])
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">Fetching inventory data...</p>
      </div>
    );
  }
  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Analytics</h1>
          <p className="text-gray-500 dark:text-gray-300">Real-time inventory insights</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-md active:scale-95"
          onClick={handleDialogue}>
          <Plus size={18} />
          <span>New Entry</span>
        </button>
      </div>

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Items', val: stats.total_items, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Inventory Value', val: stats.inventory_value, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Low Stock', val: stats.low_stocks, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Turnover Rate', val: '14%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={` p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 transition-hover hover:shadow-md
           ${s.label === "Total Items" ? "bg-linear-to-r from-blue-500 to-purple-500" : "bg-white dark:bg-slate-800" }`}>
            <div className={`${s.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <s.icon className={s.color} size={24} />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-300 font-medium">{s.label}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{s.val}</h3>
          </div>
        ))}
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart: Stock by Category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Stock Volume by Category</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stock}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="stock_volume" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Value Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Inventory Value Distribution</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.stock_value}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="stock_value"
                  
                >
                  {stats.stock_value.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Trends & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-6">Stock Trends (Added vs Sold)</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="added" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                  <Line type="monotone" dataKey="sold" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Low Stock Warnings</h2>
            <div className="space-y-4">
               {stats.low_stocks_.map((item, idx) => (
                 <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100">{item.quantity} Left</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
      {openDialogue && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-none">
                          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-bold text-gray-800">Add New Product</h3>
                                  <AiOutlineClose
                                      onClick={() => setOpenDialogue(false)}
                                      className="text-gray-400 hover:text-gray-600 text-2xl"
                                      size={20}
                                  >
                                      
                                  </AiOutlineClose>
                              </div>
      
                              <form className="space-y-4" onSubmit={handleSubmit}>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                          <input type="text" 
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600" 
                                              onChange={handleChange}
                                              value={formData.name}
                                              name="name"
                                              required
                                          />
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Category</label>
                                          <select
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                              onChange={handleChange}
                                              value={formData.category}
                                              name="category"
                                              required
                                          >
                                              <option>Choose</option>
                                              <option>Food</option>
                                              <option>Cloths</option>
                                              <option>Utensils</option>
                                              <option>Furniture</option>
                                              <option>Cosmetics</option>
                                          </select>
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                                          <input 
                                              type="number" min={1} 
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                               onChange={handleChange}
                                              value={formData.cost_price}
                                              name="cost_price"
                                              required    
                                          />
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                                          <input 
                                              type="number" min={1} 
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600" 
                                              onChange={handleChange}
                                              value={formData.unit_price}
                                              name="unit_price"
                                              required
                                          />
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                          <input 
                                              type="number" min={1} className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600" 
                                               onChange={handleChange}
                                              value={formData.quantity}
                                              name="quantity"
                                              required
                                          />
                                      </div>
                                      
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Description</label>
                                          <textarea 
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                                              onChange={handleChange}
                                              value={formData.description}
                                              name="description"
                                              required    
                                          ></textarea>
                                      </div>
                                      <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700">Image</label>
                                          <input 
                                              type="file" 
                                              className="mt-1 w-full border dark:text-black border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600" 
                                              onChange={handleChange}
                                              name="product_image"
                                          />
                                      </div>
                                  </div>
                                  
                                  <div className="flex justify-end gap-3 mt-6">
                                      <button 
                                          type="button"
                                          onClick={() => setOpenDialogue(false)}
                                          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                                      >
                                          Cancel
                                      </button>
                                      <button 
                                          type="submit"
                                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                      >
                                          Save Product
                                      </button>
                                  </div>
                              </form>
                          </div>
                      </div>
                  )}
    </div>
  );
}

export default Dashboard;
