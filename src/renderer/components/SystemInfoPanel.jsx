import React, { useEffect, useState } from 'react';
import { Cpu, Activity, HardDrive, Zap, Server, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const SystemInfoPanel = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use IPC bridge instead of fetch
                const data = await window.nizhal?.system?.getStats();
                if (data) {
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch system stats", e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000); // 2 seconds
        return () => clearInterval(interval);
    }, []);

    if (!stats) return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-cyan-500/50 font-mono text-xs">
            <Activity className="animate-spin" size={24} />
            <span className="animate-pulse tracking-widest">SYSTEM LINK...</span>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-5 font-mono text-xs text-slate-400 gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Server size={16} />
                    <span className="font-bold tracking-widest">SYSTEM METRICS</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-500/70">ONLINE</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
                {/* CPU Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-cyan-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-slate-950/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-cyan-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                <Cpu size={18} />
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.cpu}%</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">CPU Load</span>
                            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.cpu}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Memory Card */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-purple-500/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-slate-950/50 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-purple-500/30 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <HardDrive size={18} />
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.memory}%</span>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                                <span>RAM Usage</span>
                                <span>{stats.memoryUsed}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.memory}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Processes List */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-2 shrink-0">
                    <Layers size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold tracking-wider text-slate-300">TOP PROCESSES</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[10px] text-slate-600 border-b border-white/5">
                                <th className="py-2 pl-2 font-normal">APP NAME</th>
                                <th className="py-2 text-right font-normal">CPU</th>
                                <th className="py-2 pr-2 text-right font-normal">MEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.processes.map((proc, i) => (
                                <tr key={i} className="group hover:bg-white/5 transition-colors text-[11px]">
                                    <td className="py-2 pl-2 text-slate-300 truncate max-w-[100px] group-hover:text-white transition-colors">
                                        {proc.name}
                                    </td>
                                    <td className="py-2 text-right font-mono text-cyan-500/70 group-hover:text-cyan-400">
                                        {proc.cpu.toFixed(1)}%
                                    </td>
                                    <td className="py-2 pr-2 text-right font-mono text-purple-500/70 group-hover:text-purple-400">
                                        {proc.mem.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemInfoPanel;
