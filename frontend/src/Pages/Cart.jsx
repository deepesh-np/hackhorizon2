import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation denied or error", err);
        }
      );
    }
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/cart', {
        withCredentials: true
      });
      const fetchedCart = res.data.cart || [];
      setCart(fetchedCart);
      setSelectedItems(fetchedCart.map(i => i._id));
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, type) => {
    const item = cart.find(i => i._id === itemId);
    if (!item) return;

    let newQty = type === 'inc' ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) return removeFromCart(itemId);

    try {
      const res = await axios.put(`http://localhost:5000/api/cart/${itemId}`, 
      { quantity: newQty }, 
      { withCredentials: true });
      setCart(res.data.cart);
    } catch (error) {
      console.error('Quantity update failed', error);
    }
  };
  const toggleSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/cart/${itemId}`, {
        withCredentials: true
      });
      setCart(res.data.cart);
    } catch (error) {
      console.error('Remove failed', error);
    }
  };

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      
      const payload = { selectedItemIds: selectedItems };
      if (userLocation) {
        payload.userLat = userLocation.lat;
        payload.userLng = userLocation.lng;
      }

      // 1. Create order
      const orderRes = await axios.post('http://localhost:5000/api/payment/create-order', payload, {
        withCredentials: true
      });

      const { razorpayOrder, razorpayKeyId, grandTotal } = orderRes.data;

      // 2. Open Razorpay
      const options = {
        key: razorpayKeyId || 'dummy_test_id',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "QuickMed Cart Checkout",
        description: "Medicine Payment",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            await axios.post('http://localhost:5000/api/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              selectedItemIds: selectedItems
            }, { withCredentials: true });
            
            // Auto-generate detailed PDF Receipt
            try {
                const doc = new jsPDF();
                doc.setFontSize(20);
                doc.text("Vitality Platform - Official Receipt", 14, 22);
                doc.setFontSize(10);
                doc.text(`Transaction ID: ${response.razorpay_payment_id}`, 14, 32);
                doc.text(`Date & Time: ${new Date().toLocaleString()}`, 14, 38);
                
                const tableColumn = ["Medicine", "Vendor", "Qty", "Unit Price", "Total"];
                const tableRows = [];
                const itemsToBill = cart.filter(item => selectedItems.includes(item._id));
                
                itemsToBill.forEach(item => {
                    const lineTotal = (item.unitPrice || 0) * item.quantity;
                    tableRows.push([
                        item.medicine?.name || 'Unknown',
                        item.vendor?.vendorDetails?.pharmacyName || 'Platform Vendor',
                        item.quantity,
                        `Rs ${item.unitPrice || 0}`,
                        `Rs ${lineTotal}`
                    ]);
                });

                autoTable(doc, {
                    startY: 45,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'grid',
                    headStyles: { fillColor: [16, 185, 129] } // Emerald color matching UI
                });

                // In jsPDF-autotable, final Y position is stored dynamically
                const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100;
                doc.text(`Subtotal: Rs ${orderRes.data.totalMedicinePrice?.toFixed(2) || 0}`, 14, finalY);
                doc.text(`Distance-Based Delivery Fee: Rs ${orderRes.data.totalDeliveryFee?.toFixed(2) || 0}`, 14, finalY + 6);
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text(`Grand Total Charged: Rs ${grandTotal?.toFixed(2) || 0}`, 14, finalY + 16);
                
                doc.save(`Vitality_Receipt_${response.razorpay_payment_id}.pdf`);
            } catch (pdfErr) {
                console.error("PDF generation failed:", pdfErr);
                alert("Receipt generation failed: " + pdfErr.message);
            }

            alert('Payment Successful! Your receipt is downloading.');
            setCart([]); // Clear local cart
            navigate('/prescriptions'); // Navigate to orders/prescriptions page
          } catch (e) {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#3b82f6"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        alert(response.error.description);
      });
      rzp1.open();

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Checkout Error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartSubtotal = cart
    .filter(item => selectedItems.includes(item._id))
    .reduce((sum, item) => sum + ((item.unitPrice || 0) * item.quantity), 0);

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-primary">Your Cart</h1>
      
      {loading ? (
        <p>Loading cart...</p>
      ) : cart.length === 0 ? (
        <div className="text-center mt-12 bg-surface p-8 rounded-2xl shadow-sm border border-outline/20">
          <p className="text-xl text-on-surface-variant font-medium">Your cart is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-surface p-4 rounded-xl shadow-sm border border-outline-variant/30 text-sm font-bold text-on-surface-variant">
              <span>{selectedItems.length} items selected for checkout</span>
              <button 
                  onClick={() => setSelectedItems(cart.map(i => i._id))} 
                  className="text-primary hover:underline px-2"
              >Select All</button>
            </div>
            {cart.map((item) => (
              <div key={item._id} className="bg-surface border border-outline/20 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-4 flex-1">
                  <input 
                      type="checkbox" 
                      checked={selectedItems.includes(item._id)} 
                      onChange={() => toggleSelection(item._id)}
                      className="w-5 h-5 rounded border-outline/30 text-primary cursor-pointer focus:ring-primary shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-on-surface">{item.medicine?.name || 'Unknown Medicine'}</h3>
                    <p className="text-sm text-secondary font-medium mb-1">Vendor: {item.vendor?.vendorDetails?.pharmacyName}</p>
                    <p className="text-primary font-black">₹{item.unitPrice || 0} <span className="text-xs text-on-surface-variant font-medium">/ unit</span></p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center space-x-3 bg-surface-container-high rounded-lg p-1">
                  <button onClick={() => updateQuantity(item._id, 'dec')} className="px-3 py-1 bg-surface rounded shadow-sm font-bold text-primary hover:bg-primary-container">-</button>
                  <span className="font-medium px-2">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, 'inc')} className="px-3 py-1 bg-surface rounded shadow-sm font-bold text-primary hover:bg-primary-container">+</button>
                </div>
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="px-4 py-2 bg-error-container text-on-error-container rounded-xl text-sm font-medium hover:bg-error hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!userLocation && (
              <div className="p-4 bg-tertiary-container/30 text-on-tertiary-container rounded-xl border border-tertiary/20">
                 <p className="text-sm">Please allow location access to calculate accurate delivery rates.</p>
              </div>
            )}
          </div>
          
          <div className="bg-surface border border-outline/20 p-6 rounded-2xl shadow-sm h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            
            <div className="flex justify-between items-center mb-2">
               <span className="text-on-surface-variant">Subtotal</span>
               <span className="font-bold">₹{cartSubtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-outline/20">
               <span className="text-on-surface-variant">Delivery Fee</span>
               <span className="text-secondary text-sm">Calculated at checkout</span>
            </div>

            <div className="flex justify-between items-center mb-6">
               <span className="text-lg font-bold">Estimated Total</span>
               <span className="text-xl font-bold text-primary">₹{cartSubtotal.toFixed(2)} <span className="text-xs text-on-surface-variant">+ Delivery</span></span>
            </div>

            <p className="text-xs text-on-surface-variant mb-6 bg-surface-container p-3 rounded-lg">Delivery rate is calculated dynamically based on distance. Minimum order required: ₹50.</p>
            
            <button 
              onClick={handleCheckout} 
              disabled={checkoutLoading}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Processing...' : 'Checkout with Razorpay'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
