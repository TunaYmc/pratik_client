import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BrokerGateway } from '../broker/broker.gateway';
import axios from 'axios';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brokerGateway: BrokerGateway
  ) {}

  async getExchangeRates() {
    try {
      const response = await axios.get('https://open.er-api.com/v6/latest/EUR');
      return response.data;
    } catch (e) {
      console.error('Failed to fetch exchange rates', e);
      return { rates: { TRY: 40.0 } }; // fallback
    }
  }

  async onboardCompany(data: any) {
    const {
      displayName, internalName, targetHost, diskQuotaTB,
      baseOfficeEur, baseComputeEur, baseStorageEur,
      commitmentMonths, discountPct, marketingPct, netPriceEur,
      defaultPassword, employees
    } = data;

    // Create Company
    const company = await this.prisma.company.create({
      data: {
        displayName, internalName, targetHost: targetHost || "Mixed", diskQuotaTB,
        baseOfficeEur, baseComputeEur, baseStorageEur,
        commitmentMonths, discountPct, marketingPct, netPriceEur,
        defaultPassword,
        employees: {
          create: employees.map((e: any) => ({
            fullName: e.fullName,
            windowsUsername: e.windowsUsername,
            targetHost: e.targetHost,
            role: e.role
          }))
        }
      },
      include: {
        employees: true
      }
    });

    // Create User accounts
    let firstManagerId: number | null = null;
    
    // 1. First pass: create all managers
    for (const emp of company.employees) {
      if (emp.role === 'manager') {
        const user = await this.prisma.user.create({
          data: {
            email: `${emp.windowsUsername}@${internalName}.local`,
            password_hash: defaultPassword, // Warning: In production, hash this password!
            role: 'manager',
            companyId: company.id,
            rdpSettings: JSON.stringify({ multiMonitor: false, highResolution: true, clipboardRedirection: true, driveRedirection: true, audioMode: 0 })
          }
        });
        if (!firstManagerId) firstManagerId = user.id;
      }
    }

    // 2. Second pass: create users and assign to first manager
    for (const emp of company.employees) {
      if (emp.role === 'user') {
        await this.prisma.user.create({
          data: {
            email: `${emp.windowsUsername}@${internalName}.local`,
            password_hash: defaultPassword, // Warning: In production, hash this password!
            role: 'user',
            companyId: company.id,
            managerId: firstManagerId, // Link to the first manager found
            rdpSettings: JSON.stringify({ multiMonitor: false, highResolution: true, clipboardRedirection: true, driveRedirection: true, audioMode: 0 })
          }
        });
      }
    }

    // Group users by target host for broker payload
    const hostGroups: { [key: string]: any[] } = {};
    for (const emp of company.employees) {
      const host = emp.targetHost;
      if (!hostGroups[host]) hostGroups[host] = [];
      hostGroups[host].push(emp);
    }

    // Send payload to Broker Agent for each target host
    for (const [host, emps] of Object.entries(hostGroups)) {
      try {
        await this.brokerGateway.sendOnboardTask({
          companyId: company.id,
          companyName: internalName,
          targetHost: host,
          userCount: emps.length,
          users: emps.map((e: any) => e.windowsUsername),
          quotaTB: diskQuotaTB, // We might need to split quota per host, but keeping it as is for now
          defaultPassword
        });
      } catch (e) {
        console.error(`Broker agent error for host ${host}:`, e);
      }
    }

    return { success: true, company };
  }
}
