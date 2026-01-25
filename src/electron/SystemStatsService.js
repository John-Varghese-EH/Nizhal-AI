import si from 'systeminformation';

export class SystemStatsService {
    constructor() {
        this.lastCpuLoad = 0;
    }

    async getStats() {
        try {
            const [cpu, mem, processes] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.processes()
            ]);

            // Format processes (top 5 by CPU)
            const topProcesses = processes.list
                .sort((a, b) => b.cpu - a.cpu)
                .slice(0, 10)
                .map(p => ({
                    name: p.name,
                    cpu: p.cpu,
                    mem: p.mem
                }));

            return {
                cpu: Math.round(cpu.currentLoad),
                memory: Math.round((mem.active / mem.total) * 100),
                memoryTotal: (mem.total / 1024 / 1024 / 1024).toFixed(1) + ' GB',
                memoryUsed: (mem.active / 1024 / 1024 / 1024).toFixed(1) + ' GB',
                processes: topProcesses
            };
        } catch (error) {
            console.error('[SystemStats] Failed to get stats:', error);
            return null;
        }
    }
}

export const systemStatsService = new SystemStatsService();
