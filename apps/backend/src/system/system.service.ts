import { Injectable } from '@nestjs/common';
import * as si from 'systeminformation';
import * as os from 'os';

@Injectable()
export class SystemService {
    private lastCpuInfo: os.CpuInfo[] | null = null;
    private cachedCpuPercent: number = 0;

    private cachedGpuLoad: number = 0;
    private lastGpuCheckTime: number = 0;
    private GPU_CACHE_DURATION_MS = 15000; // 15 seconds

    private calculateCpuUsage(): number {
        const cpus = os.cpus();
        
        if (!this.lastCpuInfo) {
            this.lastCpuInfo = cpus;
            return this.cachedCpuPercent; // First call, no baseline
        }

        let totalIdle = 0;
        let totalTick = 0;

        for (let i = 0; i < cpus.length; i++) {
            const cpu = cpus[i];
            const prevCpu = this.lastCpuInfo[i];

            for (const type in cpu.times) {
                const typeKey = type as keyof typeof cpu.times;
                const diff = cpu.times[typeKey] - prevCpu.times[typeKey];
                totalTick += diff;
                if (type === 'idle') {
                    totalIdle += diff;
                }
            }
        }

        this.lastCpuInfo = cpus;

        if (totalTick > 0) {
            const idlePercent = totalIdle / totalTick;
            this.cachedCpuPercent = (1 - idlePercent) * 100;
        }
        
        return this.cachedCpuPercent;
    }

    async getServerLoad() {
        // Calculate CPU usage natively
        const cpuLoad = this.calculateCpuUsage();

        // Calculate RAM usage natively
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const now = Date.now();
        
        // Fire and forget GPU update to avoid blocking API request & polling spikes
        if (now - this.lastGpuCheckTime > this.GPU_CACHE_DURATION_MS) {
            this.lastGpuCheckTime = now;
            si.graphics().then(graphics => {
                let gpuLoad = 0;
                if (graphics.controllers && graphics.controllers.length > 0) {
                    gpuLoad = Math.max(...graphics.controllers.map(c => c.utilizationGpu || 0));
                }
                this.cachedGpuLoad = gpuLoad;
            }).catch(e => console.error('Failed to fetch GPU load:', e));
        }

        return {
            cpu: cpuLoad,
            ram: {
                used: usedMem / (1024 * 1024 * 1024), // GB
                total: totalMem / (1024 * 1024 * 1024), // GB
                percent: (usedMem / totalMem) * 100
            },
            gpu: this.cachedGpuLoad
        };
    }
}
