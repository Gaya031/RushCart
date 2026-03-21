import { useState, useEffect } from "react";
import {
  getSellerProducts,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  uploadProductImage,
} from "../../api/seller.api";
import { Plus, Edit, Package, Trash2 } from "lucide-react";
import RoleDashboardLayout from "../../components/layouts/RoleDashboardLayout";

const extractErrorMessage = (err, fallback) =>
  err?.response?.data?.detail ||
  err?.response?.data?.error?.message ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const fetchProducts = async () => {
    try {
      const response = await getSellerProducts();
      setProducts(response.data || []);
      setMessage("");
    } catch (err) {
      setMessage(extractErrorMessage(err, "Error fetching products"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = (formData.imageUrl || "").trim();
      if (imageFile) {
        try {
          const uploadRes = await uploadProductImage(imageFile);
          imageUrl = uploadRes?.data?.url || uploadRes?.data?.path || "";
        } catch (uploadErr) {
          setMessage(extractErrorMessage(uploadErr, "Image upload failed"));
          return;
        }
      }

      const data = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category,
        images: imageUrl ? [imageUrl] : [],
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await createProduct(data);
      }
      
      setShowModal(false);
      setEditingProduct(null);
      setImageFile(null);
      setFormData({ title: "", description: "", price: "", stock: "", category: "", imageUrl: "" });
      fetchProducts();
    } catch (err) {
      setMessage(extractErrorMessage(err, "Error saving product"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || "",
      description: product.description || "",
      price: product.price?.toString() || "",
      stock: product.stock?.toString() || "",
      category: product.category || "",
      imageUrl: product.images?.[0] || "",
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      await updateStock(productId, { stock: Number(newStock) });
      fetchProducts();
    } catch (err) {
      setMessage(extractErrorMessage(err, "Error updating stock"));
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(productId);
      fetchProducts();
    } catch (err) {
      setMessage(extractErrorMessage(err, "Error deleting product"));
    }
  };

  if (loading) {
    return (
      <RoleDashboardLayout role="seller" title="My Products">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-300"></div>
        </div>
      </RoleDashboardLayout>
    );
  }

  return (
    <RoleDashboardLayout role="seller" title="My Products">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl text-white">My Products</h1>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setImageFile(null);
              setFormData({ title: "", description: "", price: "", stock: "", category: "", imageUrl: "" });
              setShowModal(true);
            }}
            className="bg-emerald-300 text-black px-4 py-2 rounded-lg hover:bg-emerald-200 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
        {message && <p className="text-sm text-red-300 mb-3">{message}</p>}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">No products yet</h2>
            <p className="text-white/60 mb-4">Add your first product to start selling.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt={product.title} className="w-12 h-12 object-cover rounded" />
                        )}
                        <div>
                          <p className="font-medium text-white">{product.title}</p>
                          <p className="text-sm text-white/50">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStockUpdate(product.id, Math.max(0, product.stock - 1))}
                          className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-white">{product.stock}</span>
                        <button 
                          onClick={() => handleStockUpdate(product.id, product.stock + 1)}
                          className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-emerald-200 hover:text-emerald-100"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-300 hover:text-red-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-full max-w-md text-white">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"
                />
                {formData.imageUrl && !imageFile && (
                  <p className="mt-1 text-xs text-white/50">Current image will be kept unless you upload a new one.</p>
                )}
                {(imageFile || formData.imageUrl) && (
                  <img
                    src={imagePreview || formData.imageUrl}
                    alt="Product preview"
                    className="mt-2 h-20 w-20 object-cover rounded border border-white/10"
                  />
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSaving(false);
                  }}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-300 text-black rounded-lg hover:bg-emerald-200"
                >
                  {saving ? "Saving..." : `${editingProduct ? "Update" : "Add"} Product`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleDashboardLayout>
  );
}
