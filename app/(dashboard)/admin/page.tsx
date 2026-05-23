'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import ApprovalPanel from '@/components/admin/ApprovalPanel';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

export default function AdminPage() {
    return (
        <div className="space-y-10">
            <div>
                <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
                    <Shield className="h-6 w-6 text-amber-400" />
                    Admin Hub
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Centralized control panel for managing bookings, approvals, and system analytics.
                </p>
            </div>

            {/* Approval Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ApprovalPanel />
            </motion.div>

            {/* Analytics Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AnalyticsDashboard />
            </motion.div>
        </div>
    );
}