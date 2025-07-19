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
import { getAllOrders } from "@/services/ordersService";
import { getAllServices } from "@/services/servicesService";
import { getAllUsers } from "@/services/usersService";
import { formatCurrency } from "@/lib/utils";

const revenueData = [
  { month: 'Jan', revenue: 4000, orders: 45 },
  { month: 'Feb', revenue: 3000, orders: 38 },
  { month: 'Mar', revenue: 5000, orders: 62 },
  { month: 'Apr', revenue: 4500, orders: 55 },
  { month: 'May', revenue: 6000, orders: 72 },
  { month: 'Jun', revenue: 5500, orders: 68 },
];

const serviceData = [
  { name: 'Netflix', value: 35, color: '#E50914' },
  { name: 'ChatGPT', value: 25, color: '#10A37F' },
  { name: 'Canva', value: 20, color: '#00C4CC' },
  { name: 'Spotify', value: 15, color: '#1DB954' },
  { name: 'Others', value: 5, color: '#6B7280' },
];

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
        status === 'Active' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
      }`}>
        {status}
      </span>
    )
  },
  { key: 'startDate', label: 'Date' }
];

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ordersData, servicesData, usersData] = await Promise.all([
          getAllOrders(),
          getAllServices(),
          getAllUsers()
        ]);
        
        setOrders(ordersData.slice(0, 5)); // Recent 5 orders
        setServices(servicesData);
        setUsers(usersData);
        
        // Calculate stats
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.price || 0), 0);
        const totalOrders = ordersData.length;
        const activeServices = servicesData.filter(service => service.status === 'active').length;
        const totalUsers = usersData.length;
        
        setStatsData([
          {
            title: "Total Revenue",
            value: formatCurrency(totalRevenue),
            change: { value: "+12.5%", trend: "up" as const },
            icon: DollarSign,
            variant: "success" as const
          },
          {
            title: "Total Orders",
            value: totalOrders.toString(),
            change: { value: "+8.2%", trend: "up" as const },
            icon: ShoppingCart,
            variant: "default" as const
          },
          {
            title: "Active Services",
            value: activeServices.toString(),
            change: { value: "+2", trend: "up" as const },
            icon: Package,
            variant: "default" as const
          },
          {
            title: "Total Users",
            value: totalUsers.toString(),
            change: { value: "+15.3%", trend: "up" as const },
            icon: Users,
            variant: "default" as const
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle="Welcome back to Amine Jameli Services Admin Panel">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

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
          </div>

          {/* Service Distribution */}
          <div className="admin-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Service Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <DataTable 
          title="Recent Orders"
          data={orders}
          columns={orderColumns}
          searchPlaceholder="Search orders..."
        />
      </div>
    </Layout>
  );
}