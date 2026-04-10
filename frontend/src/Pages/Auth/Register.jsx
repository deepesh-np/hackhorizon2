import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

function Register() {
  const { register, user, error, setError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user', // Defaults to 'user' mapping to 'Patient' visually
    pharmacyName: '',
    licenseNumber: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Construct payload as per backend schema
    const payload = { ...formData };
    if (formData.role === 'vendor') {
      payload.vendorDetails = {
        pharmacyName: formData.pharmacyName,
        licenseNumber: formData.licenseNumber
      };
    }
    
    const success = await register(payload);
    if (success) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-lg bg-surface-container-lowest p-10 rounded-xl shadow-[0px_20px_40px_rgba(11,28,48,0.06)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-surface-container-high rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-primary-fixed/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-headline text-on-surface mb-2">Create Account</h1>
            <p className="text-secondary font-body">Join Vitality Intelligence to compare and save instantly.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm font-bold font-body">
              {error}
            </div>
          )}

          {/* Account Type Selector Chips */}
          <div className="flex gap-4 mb-8">
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'user'})}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${formData.role === 'user' ? 'bg-primary-fixed text-on-primary-fixed shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              Patient
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'vendor'})}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${formData.role === 'vendor' ? 'bg-primary-fixed text-on-primary-fixed shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              Medical Professional
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                placeholder="Dr. Sarah Jenkins"
              />
            </div>

            <div>
              <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                placeholder="sarah@clinic.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                placeholder="••••••••"
              />
            </div>

            {formData.role === 'vendor' && (
               <>
                 <div>
                   <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2 mt-4">
                     Pharmacy/Clinic Name
                   </label>
                   <input
                     type="text"
                     name="pharmacyName"
                     value={formData.pharmacyName}
                     onChange={handleChange}
                     className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                     placeholder="HealthPlus Clinic"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2 mt-4">
                     Medical License ID
                   </label>
                   <input
                     type="text"
                     name="licenseNumber"
                     value={formData.licenseNumber}
                     onChange={handleChange}
                     className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                     placeholder="MCI-12345"
                   />
                 </div>
               </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold text-lg hover:shadow-[0_10px_20px_rgba(0,110,47,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all font-body"
              >
                Register Securely
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-secondary font-body">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:text-primary-container transition-colors">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;