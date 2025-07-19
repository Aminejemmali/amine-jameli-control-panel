import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { DataTable } from "@/components/DataTable";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package,
  ShoppingCart,
  Calendar
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { subscribeToOrders } from "@/services/ordersService";
import { subscribeToServices } from "@/services/servicesService";
import { subscribeToUsers } from "@/services/usersService";
import { formatCurrency } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);
  const [ordersTimeframe, setOrdersTimeframe] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeServices: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;

    const setupSubscriptions = () => {
      // Subscribe to orders with real-time updates
      unsubscribeOrders = subscribeToOrders((ordersData) => {
        setOrders(ordersData);
        calculateRevenueData(ordersData);
        updateStats(ordersData, services, users);
      });

      // Subscribe to services with real-time updates
      unsubscribeServices = subscribeToServices((servicesData) => {
        setServices(servicesData);
        calculateServiceDistribution(servicesData, orders);
        updateStats(orders, servicesData, users);
        setLoading(false);
      });

      // Subscribe to users with real-time updates
      unsubscribeUsers = subscribeToUsers((usersData) => {
        setUsers(usersData);
        updateStats(orders, services, usersData);
      });
    };

    setupSubscriptions();

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeServices) unsubscribeServices();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  // Recalculate stats whenever data changes
  useEffect(() => {
    updateStats(orders, services, users);
  }, [orders, services, users]);

  // Recalculate service distribution when orders or services change
  useEffect(() => {
    calculateServiceDistribution(services, orders);
  }, [services, orders]);

  const calculateRevenueData = (ordersData: any[]) => {
    // Group orders by month and calculate revenue
    const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};
    
    ordersData.forEach(order => {
      if (order.startDate && order.price) {
        const date = new Date(order.startDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, orders: 0 };
        }
        
        monthlyData[monthKey].revenue += order.price;
        monthlyData[monthKey].orders += 1;
      }
    });

    // Convert to array and sort by date (last 6 months)
    const sortedData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: month.split(' ')[0], // Just month name
        ...data
      }))
      .slice(-6); // Last 6 months

    setRevenueData(sortedData);
  };

  const calculateServiceDistribution = (servicesData: any[], ordersData: any[]) => {
    if (!servicesData.length || !ordersData.length) return;

    // Count orders per service
    const serviceCounts: { [key: string]: number } = {};
    const serviceNames: { [key: string]: string } = {};
    
    // Create service name mapping
    servicesData.forEach(service => {
      serviceNames[service.id] = service.name;
      serviceCounts[service.id] = 0;
    });

    // Count orders per service
    ordersData.forEach(order => {
      if (order.serviceId && serviceCounts.hasOwnProperty(order.serviceId)) {
        serviceCounts[order.serviceId]++;
      }
    });

    // Convert to chart data
    const chartData = Object.entries(serviceCounts)
      .filter(([_, count]) => count > 0)
      .map(([serviceId, count], index) => ({
        name: serviceNames[serviceId] || 'Unknown',
        value: count,
        color: getServiceColor(index)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 services

    setServiceDistribution(chartData);
  };

  const getServiceColor = (index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    return colors[index % colors.length];
  };

  const updateStats = (ordersData: any[], servicesData: any[], usersData: any[]) => {
    if (!ordersData.length && !servicesData.length && !usersData.length) return;

    // Calculate total revenue
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.price || 0), 0);
    // Calculate total profit
    const totalProfit = ordersData.reduce((sum, order) => {
      const profit = (order.price || 0) - (order.cost || 0);
      return sum + profit;
    }, 0);
    // Count active orders
    const activeOrders = ordersData.filter(order => order.status === 'active').length;
    // Count active services
    const activeServices = servicesData.filter(service => service.status === 'active').length;
    // Calculate revenue growth (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentRevenue = ordersData
      .filter(order => new Date(order.startDate) >= thirtyDaysAgo)
      .reduce((sum, order) => sum + (order.price || 0), 0);
    const previousRevenue = ordersData
      .filter(order => {
        const orderDate = new Date(order.startDate);
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
      })
      .reduce((sum, order) => sum + (order.price || 0), 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : '0';
    // Calculate user growth
    const recentUsers = usersData.filter(user => {
      if (!user.createdAt) return false;
      const userDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return userDate >= thirtyDaysAgo;
    }).length;
    const userGrowthRate = usersData.length > 0 
      ? ((recentUsers / usersData.length) * 100).toFixed(1)
      : '0';
    // New users this month
    const newUsersThisMonth = recentUsers;
    // Orders completed this month (status === 'expired' or endDate in last 30 days and before today)
    const completedOrdersThisMonth = ordersData.filter(order => {
      if (!order.endDate) return false;
      const end = new Date(order.endDate);
      return end >= thirtyDaysAgo && end <= now;
    }).length;
    // Most profitable service
    const serviceProfits: { [key: string]: number } = {};
    ordersData.forEach(order => {
      if (!order.serviceId) return;
      const profit = (order.price || 0) - (order.cost || 0);
      serviceProfits[order.serviceId] = (serviceProfits[order.serviceId] || 0) + profit;
    });
    let mostProfitableService = null;
    let maxProfit = -Infinity;
    Object.entries(serviceProfits).forEach(([serviceId, profit]) => {
      if (profit > maxProfit) {
        maxProfit = profit;
        mostProfitableService = serviceId;
      }
    });
    const mostProfitableServiceName = servicesData.find(s => s.id === mostProfitableService)?.name || 'N/A';
    setStatsData([
      {
        title: "Total Revenue",
        value: formatCurrency(totalRevenue),
        change: { 
          value: `${parseFloat(revenueGrowth) > 0 ? '+' : ''}${revenueGrowth}%`, 
          trend: parseFloat(revenueGrowth) >= 0 ? "up" : "down" 
        },
        icon: DollarSign,
        variant: "success"
      },
      {
        title: "Total Profit",
        value: formatCurrency(totalProfit),
        change: { 
          value: totalProfit > 0 ? "Profitable" : "Loss", 
          trend: totalProfit > 0 ? "up" : "down" 
        },
        icon: TrendingUp,
        variant: totalProfit > 0 ? "success" : "destructive"
      },
      {
        title: "Active Orders",
        value: activeOrders.toString(),
        change: { 
          value: `${ordersData.length} total`, 
          trend: "neutral" 
        },
        icon: ShoppingCart,
        variant: "default"
      },
      {
        title: "Total Users",
        value: usersData.length.toString(),
        change: { 
          value: `+${userGrowthRate}% this month`, 
          trend: parseFloat(userGrowthRate) > 0 ? "up" : "neutral" 
        },
        icon: Users,
        variant: "default"
      },
      {
        title: "New Users This Month",
        value: newUsersThisMonth.toString(),
        change: { value: '', trend: "up" },
        icon: Users,
        variant: "success"
      },
      {
        title: "Orders Completed This Month",
        value: completedOrdersThisMonth.toString(),
        change: { value: '', trend: "up" },
        icon: Package,
        variant: "success"
      },
      {
        title: "Most Profitable Service",
        value: mostProfitableServiceName,
        change: { value: '', trend: "up" },
        icon: DollarSign,
        variant: "success"
      }
    ]);
  };

  // Compute per-service profit and % return
  const serviceProfitTable = services.map(service => {
    const serviceOrders = orders.filter(order => order.serviceId === service.id);
    const totalRevenue = serviceOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const totalCost = serviceOrders.reduce((sum, o) => sum + (o.cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const percentReturn = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    return {
      name: service.name,
      totalRevenue,
      totalCost,
      totalProfit,
      percentReturn,
    };
  }).filter(row => row.totalRevenue > 0 || row.totalCost > 0);

  // Orders over time chart data
  const ordersOverTimeData = useMemo(() => {
    if (!orders.length) return [];
    const dataMap: Record<string, { label: string; count: number }> = {};
    orders.forEach(order => {
      const date = new Date(order.startDate);
      let key = '';
      let label = '';
      if (ordersTimeframe === 'day') {
        key = date.toISOString().slice(0, 10);
        label = date.toLocaleDateString();
      } else if (ordersTimeframe === 'week') {
        // Get ISO week number
        const temp = new Date(date.getTime());
        temp.setHours(0,0,0,0);
        temp.setDate(temp.getDate() - temp.getDay() + 1); // Monday as first day
        const week = Math.ceil((((date as any) - (new Date(date.getFullYear(),0,1) as any)) / 86400000 + new Date(date.getFullYear(),0,1).getDay()+1)/7);
        key = `${date.getFullYear()}-W${week}`;
        label = `W${week} ${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
      if (!dataMap[key]) dataMap[key] = { label, count: 0 };
      dataMap[key].count++;
    });
    // Sort keys chronologically
    const sorted = Object.entries(dataMap).sort(([a], [b]) => a.localeCompare(b));
    // Limit to last 30 days, 12 weeks, or 12 months
    const limit = ordersTimeframe === 'day' ? 30 : 12;
    return sorted.slice(-limit).map(([_, v]) => v);
  }, [orders, ordersTimeframe]);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome back to Amine Jameli Services Admin Panel">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  // Recent orders for the table (last 5)
  const recentOrders = orders
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.startDate);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.startDate);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map(order => ({
      ...order,
      startDate: new Date(order.startDate).toLocaleDateString()
    }));

  const orderColumns = [
    { key: 'clientName', label: 'Client' },
    { key: 'serviceName', label: 'Service' },
    { 
      key: 'price', 
      label: 'Amount',
      render: (price: number) => formatCurrency(price)
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'active' ? 'bg-success/20 text-success' : 
          status === 'expired' ? 'bg-warning/20 text-warning' :
          'bg-destructive/20 text-destructive'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    },
    { key: 'startDate', label: 'Date' }
  ];

  // Expiring soon or expired orders (within 10 days or past)
  const expiringOrders = orders.filter(order => {
    if (!order.endDate) return false;
    const today = new Date(new Date().toDateString());
    const end = new Date(order.endDate);
    if (isNaN(end.getTime())) return false; // skip invalid dates
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return end <= today || (end > today && diffDays <= 10);
  }).sort((a, b) => {
    const aEnd = new Date(a.endDate);
    const bEnd = new Date(b.endDate);
    return aEnd.getTime() - bEnd.getTime();
  }).slice(0, 5);
  const expiringOrdersCount = expiringOrders.length;
  const expiredOrdersCount = expiringOrders.filter(order => {
    const end = new Date(order.endDate);
    const today = new Date(new Date().toDateString());
    return end <= today;
  }).length;

  const expiringColumns = [
    { key: 'clientName', label: 'Client' },
    { key: 'serviceName', label: 'Service' },
    {
      key: 'endDate',
      label: 'End Date',
      render: (date: string) => (
        <span className="font-medium">
          {date ? new Date(date).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => {
        const statusStr = String(status);
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            statusStr === 'active' ? 'bg-success/20 text-success' : 
            statusStr === 'expired' ? 'bg-warning/20 text-warning' :
            'bg-destructive/20 text-destructive'
          }`}>
            {statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
          </span>
        );
      }
    }
  ];

  return (
    <Layout title="Dashboard" subtitle="Welcome back to Amine Jameli Services Admin Panel">
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 items-center justify-between px-2 pt-2">
          <div className="flex gap-2">
            <button className="admin-button-primary flex items-center gap-1" onClick={() => window.location.href = '/orders'}>
              <ShoppingCart size={16} /> Add Order
            </button>
            <button className="admin-button-primary flex items-center gap-1" onClick={() => window.location.href = '/services'}>
              <Package size={16} /> Add Service
            </button>
            <button className="admin-button-primary flex items-center gap-1" onClick={() => window.location.href = '/users'}>
              <Users size={16} /> Add User
            </button>
          </div>
        </div>
        {/* Notifications/Alerts */}
        {expiringOrdersCount > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded flex items-center gap-2">
            <Calendar size={20} className="text-yellow-600" />
            <span>
              {expiredOrdersCount > 0 && (
                <b>{expiredOrdersCount} order{expiredOrdersCount > 1 ? 's are' : ' is'} expired.</b>
              )}
              {expiredOrdersCount > 0 && expiringOrdersCount > expiredOrdersCount && ' '}
              {expiringOrdersCount > expiredOrdersCount && (
                <b>{expiringOrdersCount - expiredOrdersCount} order{expiringOrdersCount - expiredOrdersCount > 1 ? 's are' : ' is'} expiring soon.</b>
              )}
            </span>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Per-Service Profit Table */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Service Profitability</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Service</th>
                  <th className="px-4 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                  <th className="px-4 py-2 text-right">Profit</th>
                  <th className="px-4 py-2 text-right">% Return</th>
                </tr>
              </thead>
              <tbody>
                {serviceProfitTable.map(row => (
                  <tr key={row.name}>
                    <td className="px-4 py-2 font-medium">{row.name}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.totalRevenue)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(row.totalCost)}</td>
                    <td className={"px-4 py-2 text-right " + (row.totalProfit >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(row.totalProfit)}</td>
                    <td className={"px-4 py-2 text-right " + (row.percentReturn >= 0 ? "text-success" : "text-destructive")}>{row.totalCost > 0 ? row.percentReturn.toFixed(1) + '%' : '-'}</td>
                  </tr>
                ))}
                {serviceProfitTable.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-4">No service data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Soon/Expired Orders Widget */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={20} /> Expiring Soon / Expired Orders
          </h3>
          {expiringOrders.length > 0 ? (
            <DataTable
              title="Expiring Soon / Expired Orders"
              data={expiringOrders}
              columns={expiringColumns}
              searchPlaceholder="Search expiring orders..."
            />
          ) : (
            <div className="flex items-center justify-center h-24 text-muted-foreground">
              No expiring or expired orders
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders Over Time Chart */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Orders Over Time</h3>
              <ToggleGroup type="single" value={ordersTimeframe} onValueChange={v => v && setOrdersTimeframe(v as 'day' | 'week' | 'month')}>
                <ToggleGroupItem value="day">Day</ToggleGroupItem>
                <ToggleGroupItem value="week">Week</ToggleGroupItem>
                <ToggleGroupItem value="month">Month</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {ordersOverTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ordersOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No order data available
              </div>
            )}
          </div>
          {/* Revenue Chart */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Overview</h3>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No revenue data available
              </div>
            )}
          </div>

          {/* Service Distribution */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Popular Services</h3>
            {serviceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {serviceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No service data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 ? (
          <DataTable 
            title="Recent Orders"
            data={recentOrders}
            columns={orderColumns}
            searchPlaceholder="Search orders..."
          />
        ) : (
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No orders found
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}