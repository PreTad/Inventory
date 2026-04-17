import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import { AiOutlineSearch,
                AiOutlinePlus,
                AiOutlineClose,
                AiOutlineArrowDown,
                AiOutlineLeftCircle,
                AiOutlineRightCircle}

    from 'react-icons/ai';

const columns = [
    { id: 'product_image', label: 'Image', minWidth: 70 },
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'sku', label: 'SKU', minWidth: 120 },
    { id: 'category', label: 'Category', minWidth: 120 },
    { id: 'description', label: 'Description', minWidth: 250 },
    { id: 'cost_price', label: 'Cost Price', minWidth: 110 },
    { id: 'unit_price', label: 'Unit Price', minWidth: 110 },
    { id: 'quantity', label: 'Qty', minWidth: 80 },
    { id: 'created_at', label: 'Date Added', minWidth: 120 },
];

const API = import.meta.env.VITE_API_URL

const Products = () => {
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); 
    const [search, setSearch] = useState(''); 
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [isSearching, setIsSearching] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);
    const [openDialogue, setOpenDialogue] = useState(false);
    const [formData, setFormData] = useState({
        name : '',
        category : '',
        cost_price : '',
        unit_price : '',
        quantity : '',
        description : '',
        product_image : '',
    });

    const handleChange = (e) => {
        const { name, value, files, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'file' ? files[0] : value
        }));
    };

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
            fetchReports(false);
        }catch(err){
            const message = err.response?.data
            ? JSON.stringify(err.response.data)
            : "Something is wrong!";
             alert(message);
        }
    }

    const fetchReports = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setIsSearching(true);

            const response = await axios.get(`${API}/api/products/`, {
                params: { 
                    search: search,
                    page: page,
                    page_size : pageSize }
            });

            const payload = response.data;
            if (Array.isArray(payload)) {
                setRows(payload);
                setTotalCount(payload.length);
                setNextPageUrl(null);
                setPreviousPageUrl(null);
            } else {
                setRows(payload.results || []);
                setTotalCount(payload.count || 0);
                setNextPageUrl(payload.next || null);
                setPreviousPageUrl(payload.previous || null);
            }
            setError('');
        } catch (err) {
            setError("Unable to fetch the data!");
            console.error(err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [search, page,pageSize]);
    const handleDialogue = () =>{
        setOpenDialogue(true);
    }

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchReports(rows.length === 0 && search === '' && page === 1);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, fetchReports,pageSize]);

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setPage(1); 
    };
    if (loading && rows.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 font-sans text-gray-500 dark:text-gray-300">
                <div className="animate-pulse">Loading Inventory...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-slate-900 min-h-screen px-4 md:px-6">
            <div className="bg-gray-50 dark:bg-slate-900 pt-4 pb-4">
                <div className="font-serif font-bold text-3xl mb-6 text-gray-800 dark:text-gray-100 border-b-stone-50">
                    <h2 >Inventory Products</h2>
                </div>

                <div className="font-sans mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-sm py-1.5">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <AiOutlineSearch 
                                className={`${isSearching ? 'animate-spin text-green-600' : 'text-gray-400 dark:text-gray-500'}`} 
                                size={20} 
                        />
                    </span>
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }} 
                        placeholder="Search by name or SKU..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 dark:text-gray-100"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <button 
                        onClick={handleDialogue}
                        className="h-10 w-full sm:w-auto px-4 flex items-center justify-center font-bold gap-1 bg-green-600 rounded-lg">
                        <AiOutlinePlus ></AiOutlinePlus>
                        Add item
                    </button>
                </div>
            </div>
            </div>


            <div className="w-full overflow-auto max-h-[60vh] rounded-xl shadow-md bg-white dark:bg-slate-800">
                <table className="min-w-[1100px] w-full text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-200 sticky top-0 bg-gray-100 dark:bg-slate-700 z-10"
                                    style={{ width: column.minWidth, minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length > 0 ? (
                            rows.map((row, index) => (
                                <tr key={row.id || index} className="hover:bg-green-50/50 transition-colors">
                                    {columns.map((column) => (
                                        <td key={column.id} className="px-6 py-2 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                            {column.id === 'product_image' ? (
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
                                                    <img 
                                                        src={row[column.id]} 
                                                        alt="" 
                                                        className="max-w-full max-h-full object-contain p-1" 
                                                    />
                                                </div>
                                            ) : column.id === 'cost_price' || column.id === 'unit_price' ? (
                                                <span className="font-medium text-gray-900 dark:text-white">{row[column.id]}</span>
                                            ) : (
                                                column.id === 'quantity' && row[column.id] < 10 ? (
                                                    <div className="flex items-center gap-3 py-2 rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:translate-x-1">
                                                        <AiOutlineArrowDown className="text-xl text-indigo-500" />                                        
                                                        <span className="text-sm font-medium text-red-700">
                                                        {row[column.id]}
                                                        </span>
                                                    </div>
                                                    
                                                ) : row[column.id] || "-"
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400 dark:text-gray-300 font-sans">
                                    No products matching "{search}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="font-[16px] font-semibold mt-4 mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600 dark:text-gray-200 bg-gray-200 dark:bg-slate-800 p-3 rounded-lg">
                <p className="bg-white dark:bg-slate-700 px-4 py-2 rounded-lg font-bold font-italic w-full md:w-auto text-center md:text-left">Total products: {totalCount}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                    <label className="whitespace-nowrap">Items per page:</label>
                    <select value={pageSize} onChange={handlePageSizeChange} className="px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                    <button
                        type="button"
                        disabled={!previousPageUrl || isSearching}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <AiOutlineLeftCircle size={25}/>
                    </button>
                    <span className="px-2">Page {page}</span>
                    <button
                        type="button"
                        disabled={!nextPageUrl || isSearching}
                        onClick={() => setPage((prev) => prev + 1)}
                        className="px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <AiOutlineRightCircle size={25}/>
                    </button>
                </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

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
};

export default Products;
