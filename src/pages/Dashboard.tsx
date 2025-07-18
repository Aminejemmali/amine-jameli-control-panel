import { Layout } from "@/components/Layout";
import { StatsCard } from "@/components/StatsCard";
import { DataTable } from "@/components/DataTable";
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

// Mock data for demo
const statsData = [
  {
    title: "Total Revenue",
    value: "$24,567",
    change: { value: "+12.5%", trend: "up" as const },
    icon: DollarSign,
    variant: "success" as const
  },
  {
    title: "Total Orders",
    value: "1,247",
    change: { value: "+8.2%", trend: "up" as const },
    icon: ShoppingCart,
    variant: "default" as const
  },
  {
    title: "Active Services",
    value: "23",
    change: { value: "+2", trend: "up" as const },
    icon: Package,
    variant: "default" as const
  },
  {
    title: "Total Users",
    value: "892",
    change: { value: "+15.3%", trend: "up" as const },
    icon: Users,
    variant: "default" as const
  }
];

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

const recentOrders = [
  {
    id: '1',
    client: 'John Doe',
    service: 'Netflix Premium',
    amount: '$15.99',
    status: 'Active',
    date: '2024-07-15'
  },
  {
    id: '2',
    client: 'Jane Smith',
    service: 'ChatGPT Plus',
    amount: '$20.00',
    status: 'Active',
    date: '2024-07-14'
  },
  {
    id: '3',
    client: 'Mike Johnson',
    service: 'Canva Pro',
    amount: '$12.99',
    status: 'Expired',
    date: '2024-07-13'
  }
];

const orderColumns = [
  { key: 'client', label: 'Client' },
  { key: 'service', label: 'Service' },
  { key: 'amount', label: 'Amount' },
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
  { key: 'date', label: 'Date' }
];

export default function Dashboard() {
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
          data={recentOrders}
          columns={orderColumns}
          searchPlaceholder="Search orders..."
        />
      </div>
    </Layout>
  );
}