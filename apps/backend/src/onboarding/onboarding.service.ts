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
        defaultPassword, campaign: data.campaign || 'none',
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

    // Create User accounts, WindowsAccounts, and Assignments
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

        const winAcc = await this.prisma.windowsAccount.create({
          data: {
            windows_username: emp.windowsUsername,
            host: emp.targetHost,
            description: `${emp.fullName} - ${company.displayName}`
          }
        });

        await this.prisma.userAssignment.create({
          data: {
            userId: user.id,
            windowsAccountId: winAcc.id
          }
        });
      }
    }

    // 2. Second pass: create users and assign to first manager
    for (const emp of company.employees) {
      if (emp.role === 'user') {
        const user = await this.prisma.user.create({
          data: {
            email: `${emp.windowsUsername}@${internalName}.local`,
            password_hash: defaultPassword, // Warning: In production, hash this password!
            role: 'user',
            companyId: company.id,
            managerId: firstManagerId, // Link to the first manager found
            rdpSettings: JSON.stringify({ multiMonitor: false, highResolution: true, clipboardRedirection: true, driveRedirection: true, audioMode: 0 })
          }
        });

        const winAcc = await this.prisma.windowsAccount.create({
          data: {
            windows_username: emp.windowsUsername,
            host: emp.targetHost,
            description: `${emp.fullName} - ${company.displayName}`
          }
        });

        await this.prisma.userAssignment.create({
          data: {
            userId: user.id,
            windowsAccountId: winAcc.id
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

  async getCompanies() {
    return this.prisma.company.findMany({
      include: {
        employees: true,
        users: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCompany(id: number) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        employees: true,
        users: true
      }
    });
  }

  async deleteCompany(id: number) {
    // We should also delete the users and their windows accounts if possible
    // Users are cascade deleted via companyId (if configured).
    // Let's manually ensure we delete windows accounts for users in this company before deleting company
    const usersInCompany = await this.prisma.user.findMany({
      where: { companyId: id },
      include: { assignments: true }
    });

    for (const user of usersInCompany) {
      for (const assignment of user.assignments) {
        // Delete windows account
        await this.prisma.windowsAccount.delete({
          where: { id: assignment.windowsAccountId }
        });
      }
    }

    // Now delete the company (this cascades to employees and users)
    await this.prisma.company.delete({
      where: { id }
    });

    return { success: true };
  }

  async addEmployeeToCompany(companyId: number, data: any) {
    const { fullName, windowsUsername, targetHost, role } = data;
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found');

    // Create employee
    const emp = await this.prisma.companyEmployee.create({
      data: {
        companyId,
        fullName,
        windowsUsername,
        targetHost,
        role
      }
    });

    // Find the manager
    const manager = await this.prisma.user.findFirst({
      where: { companyId, role: 'manager' }
    });

    // Create User, WindowsAccount, Assignment
    const user = await this.prisma.user.create({
      data: {
        email: `${windowsUsername}@${company.internalName}.local`,
        password_hash: company.defaultPassword,
        role: role,
        companyId,
        managerId: role === 'user' ? manager?.id : undefined,
        rdpSettings: JSON.stringify({ multiMonitor: false, highResolution: true, clipboardRedirection: true, driveRedirection: true, audioMode: 0 })
      }
    });

    const winAcc = await this.prisma.windowsAccount.create({
      data: {
        windows_username: windowsUsername,
        host: targetHost,
        description: `${fullName} - ${company.displayName}`
      }
    });

    await this.prisma.userAssignment.create({
      data: {
        userId: user.id,
        windowsAccountId: winAcc.id
      }
    });

    // Send broker payload for just this user
    try {
      await this.brokerGateway.sendOnboardTask({
        companyId: company.id,
        companyName: company.internalName,
        targetHost,
        userCount: 1,
        users: [windowsUsername],
        quotaTB: company.diskQuotaTB, 
        defaultPassword: company.defaultPassword
      });
    } catch (e) {
      console.error('Broker error:', e);
    }

    return emp;
  }

  async removeEmployeeFromCompany(companyId: number, employeeId: number) {
    const emp = await this.prisma.companyEmployee.findUnique({ where: { id: employeeId }, include: { company: true } });
    if (!emp) throw new Error('Employee not found');

    // Find User
    const user = await this.prisma.user.findFirst({
      where: { companyId, email: { startsWith: emp.windowsUsername } }
    });

    if (user) {
      // Find and delete windows account
      const assignments = await this.prisma.userAssignment.findMany({ where: { userId: user.id } });
      for (const a of assignments) {
        await this.prisma.windowsAccount.delete({ where: { id: a.windowsAccountId } });
      }
      // Delete user
      await this.prisma.user.delete({ where: { id: user.id } });
    }

    // Delete company employee
    await this.prisma.companyEmployee.delete({ where: { id: employeeId } });

    // TODO: Send broker payload to delete user
    return { success: true };
  }
}
