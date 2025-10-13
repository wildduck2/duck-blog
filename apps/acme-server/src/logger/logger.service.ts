import { execSync } from 'node:child_process'
import { Injectable } from '@nestjs/common'

@Injectable()
export class LoggerService {
  getRequestMetadata(req: any) {
    const ip = this.getIp(req)

    return {
      headers: req.headers,
      ip,
      referer: req.headers['referer'] || '',
      userAgent: req.headers['user-agent'] || '',
    }
  }

  private getIp(req: any): string {
    const xForwardedFor = req.headers['x-forwarded-for']
    const ip =
      (typeof xForwardedFor === 'string' ? xForwardedFor.split(',')[0].trim() : null) ||
      req.ip ||
      req.connection?.remoteAddress ||
      ''

    if (this.isPrivateIp(ip)) {
      return this.getPublicIpSync() || ip
    }

    return ip
  }

  private isPrivateIp(ip: string): boolean {
    return (
      ip.startsWith('127.') ||
      ip.startsWith('10.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('172.') ||
      ip === '::1'
    )
  }

  private getPublicIpSync(): string | null {
    try {
      return execSync('curl -s https://api.ipify.org', { timeout: 1000 }).toString().trim()
    } catch {
      return null
    }
  }
}
