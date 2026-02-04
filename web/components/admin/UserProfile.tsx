"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Clock } from 'lucide-react';
import { User as UserType } from '../../lib/AuthContext';

interface UserProfileProps {
    user: UserType;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/10">
                    <User className="w-8 h-8 text-white/40" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                    <p className="text-sm text-white/60">{user.role}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Clearance Level</h3>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#00FF95]" />
                        <span className="text-lg font-black text-white tracking-tighter uppercase">{user.clearance_level}</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Sovereign Identity</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Shield className={`w-5 h-5 ${user.nin_verified ? 'text-[#00FF95]' : 'text-red-500'}`} />
                            <span className={`text-xs font-black uppercase tracking-widest ${user.nin_verified ? 'text-white' : 'text-red-500'}`}>
                                {user.nin_verified ? 'NIMC Verified' : 'Unverified'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className={`w-5 h-5 ${user.biometric_enrolled ? 'text-[#00FF95]' : 'text-white/20'}`} />
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">
                                {user.biometric_enrolled ? 'Biometrics Active' : 'No Biometrics'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfile;
