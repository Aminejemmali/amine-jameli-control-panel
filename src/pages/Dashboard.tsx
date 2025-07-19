import { useState, useEffect } from "react";
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

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);

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

    setStatsData([
      {
        title: "Total Revenue",
        value: formatCurrency(totalRevenue),
        change: { 
          value: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}%`, 
          trend: parseFloat(revenueGrowth) >= 0 ? "up" as const : "down" as const 
        },
        icon: DollarSign,
        variant: "success" as const
      },
      {
        title: "Total Profit",
        value: formatCurrency(totalProfit),
        change: { 
          value: totalProfit > 0 ? "Profitable" : "Loss", 
          trend: totalProfit > 0 ? "up" as const : "down" as const 
        },
        icon: TrendingUp,
        variant: totalProfit > 0 ? "success" as const : "destructive" as const
      },
      {
        title: "Active Orders",
        value: activeOrders.toString(),
        change: { 
          value: `${ordersData.length} total`, 
          trend: "neutral" as const 
        },
        icon: ShoppingCart,
        variant: "default" as const
      },
      {
        title: "Total Users",
        value: usersData.length.toString(),
        change: { 
          value: `+${userGrowthRate}% this month`, 
          trend: parseFloat(userGrowthRate) > 0 ? "up" as const : "neutral" as const 
        },
        icon: Users,
        variant: "default" as const
      }
    ]);
  };

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

  return (
    <Layout title="Dashboard" subtitle="Welcome back to Amine Jameli Services Admin Panel">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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