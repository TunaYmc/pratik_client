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
        displayName, internalName, targetHost, diskQuotaTB,
        baseOfficeEur, baseComputeEur, baseStorageEur,
        commitmentMonths, discountPct, marketingPct, netPriceEur,
        defaultPassword,
        employees: {
          create: employees.map((e: any) => ({
            fullName: e.fullName,
            windowsUsername: e.windowsUsername
          }))
        }
      },
      include: {
        employees: true
      }
    });

    // Send payload to Broker Agent
    try {
      await this.brokerGateway.sendOnboardTask({
        companyId: company.id,
        companyName: internalName,
        userCount: employees.length,
        users: employees.map((e: any) => e.windowsUsername),
        quotaTB: diskQuotaTB,
        defaultPassword
      });
    } catch (e) {
      console.error('Broker agent error:', e);
      // Depending on requirements, we could fail here, but usually it's asynchronous
      return { success: true, company, warning: 'Broker Agent offline. Will be executed when it reconnects (or handled manually).' };
    }

    return { success: true, company };
  }
}
