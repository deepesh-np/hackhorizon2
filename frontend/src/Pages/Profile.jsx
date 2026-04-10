import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import api from '../services/api';

function Profile() {
    const { user, loading: authLoading, checkAuth } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Profile update state
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        profilePicture: null,
    });
    const [vendorForm, setVendorForm] = useState({
        pharmacyName: '',
        licenseNumber: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [profileMsg, setProfileMsg] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);

    // Change password state
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordMsg, setPasswordMsg] = useState(null);
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                profilePicture: null,
            });
            setPreviewImage(user.profilePicture || null);

            if (user.role === 'vendor' && user.vendorDetails) {
                setVendorForm({
                    pharmacyName: user.vendorDetails.pharmacyName || '',
                    licenseNumber: user.vendorDetails.licenseNumber || '',
                    street: user.vendorDetails.address?.street || '',
                    city: user.vendorDetails.address?.city || '',
                    state: user.vendorDetails.address?.state || '',
                    pincode: user.vendorDetails.address?.pincode || '',
                });
            }
        }
    }, [user, authLoading, navigate]);

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setProfileMsg({ type: 'error', text: 'Image must be under 2MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
            setProfileForm(prev => ({ ...prev, profilePicture: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // ── PUT /auth/update-profile ──
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMsg(null);
        try {
            const payload = {
                name: profileForm.name,
                phone: profileForm.phone,
            };

            // Only send profilePicture if user picked a new one
            if (profileForm.profilePicture) {
                payload.profilePicture = profileForm.profilePicture;
            }

            // Include vendor details if vendor
            if (user.role === 'vendor') {
                payload.vendorDetails = {
                    pharmacyName: vendorForm.pharmacyName,
                    licenseNumber: vendorForm.licenseNumber,
                    address: {
                        street: vendorForm.street,
                        city: vendorForm.city,
                        state: vendorForm.state,
                        pincode: vendorForm.pincode,
                    },
                };
            }

            const res = await api.put('/auth/update-profile', payload);
            if (res.data.success) {
                setProfileMsg({ type: 'success', text: res.data.message || 'Profile updated successfully!' });
                // Refresh the user in AuthContext
                await checkAuth();
            }
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setProfileSaving(false);
        }
    };

    // ── PUT /auth/change-password ──
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPasswordSaving(true);
        setPasswordMsg(null);
        try {
            const res = await api.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            if (res.data.success) {
                setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
        } finally {
            setPasswordSaving(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center text-secondary">Loading...</div>;
    if (!user) return null;

    const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <div className="min-h-[calc(100vh-72px)] bg-surface pt-24 pb-12 px-4 md:px-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight">Profile Settings</h1>
                <p className="text-secondary font-body mt-2 text-lg">Manage your account details and security</p>
            </header>

            {/* User Info Card with Avatar */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm mb-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary-fixed/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center gap-6">
                    {/* Clickable Avatar */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-full cursor-pointer group"
                        title="Click to change photo"
                    >
                        {previewImage ? (
                            <img
                                src={previewImage}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-primary-container shadow-md"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-3xl font-headline font-bold shadow-md">
                                {initials}
                            </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-headline font-bold text-on-surface">{user.name}</h2>
                        <p className="text-secondary">{user.email}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-3 py-1 bg-primary-container text-on-primary-container rounded-full font-bold uppercase tracking-wider">{user.role}</span>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${user.isActive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.role === 'vendor' && user.vendorDetails?.isVerified && (
                                <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-wider">
                                    ✓ Verified Vendor
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Update Profile Form */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm mb-8">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Update Profile</h2>
                {profileMsg && (
                    <div className={`mb-4 p-4 rounded-xl text-sm font-bold ${profileMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'}`}>
                        {profileMsg.text}
                    </div>
                )}
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
                            <input
                                type="text"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Phone (10 digits)</label>
                            <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                placeholder="9876543210"
                                maxLength={10}
                                className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Email (read-only)</label>
                        <input
                            type="email"
                            value={user.email}
                            readOnly
                            className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/10 rounded-t-md font-body text-secondary cursor-not-allowed"
                        />
                    </div>

                    {/* Vendor-specific fields */}
                    {user.role === 'vendor' && (
                        <>
                            <hr className="border-outline-variant/20 my-2" />
                            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Pharmacy Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Pharmacy Name</label>
                                    <input
                                        type="text"
                                        value={vendorForm.pharmacyName}
                                        onChange={(e) => setVendorForm({ ...vendorForm, pharmacyName: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">License Number</label>
                                    <input
                                        type="text"
                                        value={vendorForm.licenseNumber}
                                        onChange={(e) => setVendorForm({ ...vendorForm, licenseNumber: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                    />
                                </div>
                            </div>

                            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Address</h3>
                            <div>
                                <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Street</label>
                                <input
                                    type="text"
                                    value={vendorForm.street}
                                    onChange={(e) => setVendorForm({ ...vendorForm, street: e.target.value })}
                                    className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">City</label>
                                    <input
                                        type="text"
                                        value={vendorForm.city}
                                        onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">State</label>
                                    <input
                                        type="text"
                                        value={vendorForm.state}
                                        onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })}
                                        className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Pincode</label>
                                    <input
                                        type="text"
                                        value={vendorForm.pincode}
                                        onChange={(e) => setVendorForm({ ...vendorForm, pincode: e.target.value })}
                                        maxLength={6}
                                        className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </section>

            {/* Change Password Form */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                <h2 className="text-xl font-headline font-bold text-on-surface mb-6">Change Password</h2>
                {passwordMsg && (
                    <div className={`mb-4 p-4 rounded-xl text-sm font-bold ${passwordMsg.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container'}`}>
                        {passwordMsg.text}
                    </div>
                )}
                <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Current Password</label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                                className="w-full px-4 py-3 bg-surface border-b-2 border-outline-variant/30 focus:bg-white focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={passwordSaving}
                        className="px-8 py-3 bg-on-surface text-white rounded-full font-bold hover:bg-black hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {passwordSaving ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </section>
        </div>
    );
}

export default Profile;
