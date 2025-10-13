'use client'

import { Button } from '@acme/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@acme/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@acme/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@acme/ui/select'
import { Skeleton } from '@acme/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@acme/ui/toggle-group'
import { useIsMobile } from '@gentleduck/hooks/use-is-mobile'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Key, RefreshCw, Users } from 'lucide-react'
import React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'
import { server_api } from '~/libs/axios'

// Types
interface TokenOverview {
  total: number
  expired: number
  active: number
  expiringSoon: number
  deleted: number
}

interface TokenTimeSeries {
  date: string
  tokensCreated: number
  activeTokensCreated: number
  usersRegistered: number
  userLogins: number
}

interface PercentageChanges {
  totalTokensChange: number
  activeTokensChange: number
  expiringSoonChange: number
  totalUsersChange: number
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  recentlyActive: number
  deletedUsers: number
}

interface DashboardData {
  timestamp: string
  percentageChanges: PercentageChanges
  timeSeries: TokenTimeSeries[]
  tokens: {
    overview: TokenOverview
    byStatus: any[]
    byService: any[]
    expiringSoon: any[]
    needingNotification: any[]
    renewalStats: any
  }
  users: {
    stats: UserStats
    topUsers: any[]
  }
  otp: any
}

// Chart Config
const chartConfig = {
  activeTokens: {
    color: 'var(--chart-1)',
    label: 'Active Tokens',
  },
  tokens: {
    color: 'var(--chart-2)',
    label: 'Total Tokens',
  },
} satisfies ChartConfig

// Components
function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  description,
  icon: Icon,
}: {
  title: string
  value: string | number
  trend?: 'up' | 'down'
  trendLabel?: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        {trend && trendLabel && (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' ? (
              <ArrowUp className="h-3 w-3 text-chart-2" />
            ) : (
              <ArrowDown className="h-3 w-3 text-chart-1" />
            )}
            <span className={trend === 'up' ? 'text-chart-2' : 'text-chart-1'}>{trendLabel}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-bold text-3xl">{value}</div>
            <p className="mt-1 text-muted-foreground text-xs">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function ChartAreaInteractive({
  data,
  timeRange,
  onTimeRangeChange,
}: {
  data: TokenTimeSeries[]
  timeRange: string
  onTimeRangeChange: (value: string) => void
}) {
  const isMobile = useIsMobile()

  React.useEffect(() => {
    if (isMobile && timeRange === '90d') {
      onTimeRangeChange('7d')
    }
  }, [isMobile, timeRange, onTimeRangeChange])

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    let daysToShow = 90
    if (timeRange === '30d') {
      daysToShow = 30
    } else if (timeRange === '7d') {
      daysToShow = 7
    }

    return data.slice(-daysToShow)
  }, [data, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Token Activity</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">Token creation and activity over time</span>
          <span className="@[540px]/card:hidden">Token activity</span>
        </CardDescription>
        <div className="absolute top-4 right-4">
          <ToggleGroup
            className="@[767px]/card:flex hidden"
            onValueChange={onTimeRangeChange}
            type="single"
            value={timeRange}
            variant="outline">
            <ToggleGroupItem className="h-9 px-2.5" value="90d">
              Last 3 months
            </ToggleGroupItem>
            <ToggleGroupItem className="h-9 px-2.5" value="30d">
              Last 30 days
            </ToggleGroupItem>
            <ToggleGroupItem className="h-9 px-2.5" value="7d">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>
          <Select onValueChange={onTimeRangeChange} value={timeRange}>
            <SelectTrigger aria-label="Select a value" className="flex @[767px]/card:hidden w-40">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem className="rounded-lg" value="90d">
                Last 3 months
              </SelectItem>
              <SelectItem className="rounded-lg" value="30d">
                Last 30 days
              </SelectItem>
              <SelectItem className="rounded-lg" value="7d">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillActiveTokens" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillTokens" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                })
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  }}
                />
              }
              cursor={false}
            />
            <Area
              dataKey="activeTokensCreated"
              fill="url(#fillActiveTokens)"
              name="Active Tokens"
              stackId="a"
              stroke="var(--color-chart-1)"
              type="natural"
            />
            <Area
              dataKey="tokensCreated"
              fill="url(#fillTokens)"
              name="Total Tokens"
              stackId="a"
              stroke="var(--color-chart-2)"
              type="natural"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Main Component
export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d'>('30d')

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DashboardData>({
    queryFn: async () => {
      const range = timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : 'quarter'
      const { data: res } = await server_api.get(`/analytics/dashboard?range=${range}`)
      return res.data
    },
    queryKey: ['analytics-dashboard', timeRange],
    refetchInterval: 30000,
  })

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getTrend = (value: number): 'up' | 'down' => {
    return value >= 0 ? 'up' : 'down'
  }

  const healthScore = data ? Math.round((data.tokens.overview.active / data.tokens.overview.total) * 100) : 0

  React.useEffect(() => {
    if (isError) {
      toast.error('Failed to load analytics')
    }
  }, [isError])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>Failed to load analytics data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm">Monitor your token infrastructure</p>
          </div>
          <Button disabled={isFetching} onClick={() => refetch()} size="sm" variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            description="All tokens in system"
            icon={Key}
            title="Total Tokens"
            trend={getTrend(data.percentageChanges.totalTokensChange)}
            trendLabel={formatPercentage(data.percentageChanges.totalTokensChange)}
            value={data.tokens.overview.total.toLocaleString()}
          />
          <MetricCard
            description={`${healthScore}% of total`}
            icon={CheckCircle2}
            title="Active Tokens"
            trend={getTrend(data.percentageChanges.activeTokensChange)}
            trendLabel={formatPercentage(data.percentageChanges.activeTokensChange)}
            value={data.tokens.overview.active.toLocaleString()}
          />
          <MetricCard
            description="Next 30 days"
            icon={Clock}
            title="Expiring Soon"
            trend={getTrend(data.percentageChanges.expiringSoonChange)}
            trendLabel={formatPercentage(data.percentageChanges.expiringSoonChange)}
            value={data.tokens.overview.expiringSoon.toLocaleString()}
          />
          <MetricCard
            description="Registered users"
            icon={Users}
            title="Total Users"
            trend={getTrend(data.percentageChanges.totalUsersChange)}
            trendLabel={formatPercentage(data.percentageChanges.totalUsersChange)}
            value={data.users.stats.totalUsers.toLocaleString()}
          />
        </div>

        {/* Time Series Chart */}
        <ChartAreaInteractive
          data={data.timeSeries}
          onTimeRangeChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}
          timeRange={timeRange}
        />

        {/* Footer */}
        <div className="text-center text-muted-foreground text-xs">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
