import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign } from "lucide-react";

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  startDate: string;
  endDate?: string;
  price: number;
  cost: number;
  paymentMethodId: string;
  paymentMethod: string;
  status: 'active' | 'expired' | 'cancelled';
}

// Mock data
const mockOrders: Order[] = [
  {
    id: '1',
    clientId: 'u1',
    clientName: 'John Doe',
    serviceId: 's1',
    serviceName: 'Netflix Premium',
    startDate: '2024-07-01',
    endDate: '2024-08-01',
    price: 15.99,
    cost: 12.00,
    paymentMethodId: 'pm1',
    paymentMethod: 'Visa',
    status: 'active'
  },
  {
    id: '2',
    clientId: 'u2',
    clientName: 'Jane Smith',
    serviceId: 's2',
    serviceName: 'ChatGPT Plus',
    startDate: '2024-06-15',
    endDate: '2024-07-15',
    price: 20.00,
    cost: 15.00,
    paymentMethodId: 'pm2',
    paymentMethod: 'PayPal',
    status: 'expired'
  }
];

const mockServices = [
  { id: 's1', name: 'Netflix Premium', hasExpiration: true },
  { id: 's2', name: 'ChatGPT Plus', hasExpiration: true },
  { id: 's3', name: 'Canva Pro', hasExpiration: true }
];

const mockUsers = [
  { id: 'u1', name: 'John Doe' },
  { id: 'u2', name: 'Jane Smith' },
  { id: 'u3', name: 'Mike Johnson' }
];

const mockPaymentMethods = [
  { id: 'pm1', type: 'Visa' },
  { id: 'pm2', type: 'PayPal' },
  { id: 'pm3', type: 'Bank Transfer' }
];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null);
  const { toast } = useToast();

  const columns = [
    { key: 'clientName', label: 'Client' },
    { key: 'serviceName', label: 'Service' },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (date: string) => (
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-muted-foreground" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'endDate',
      label: 'End Date',
      render: (date: string) => date ? (
        <div className="flex items-center space-x-2">
          <Calendar size={16} className="text-muted-foreground" />
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (price: number) => (
        <div className="flex items-center space-x-1">
          <DollarSign size={16} className="text-success" />
          <span className="font-medium">${price.toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (cost: number) => (
        <span className="text-muted-foreground">${cost.toFixed(2)}</span>
      )
    },
    {
      key: 'profit',
      label: 'Profit',
      render: (_, order: Order) => {
        const profit = order.price - order.cost;
        return (
          <span className={`font-medium ${profit > 0 ? 'text-success' : 'text-destructive'}`}>
            ${profit.toFixed(2)}
          </span>
        );
      }
    },
    { key: 'paymentMethod', label: 'Payment' },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <Badge
          variant={
            status === 'active' ? 'default' :
            status === 'expired' ? 'secondary' : 'destructive'
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    }
  ];

  const handleAdd = () => {
    setEditingOrder(null);
    setSelectedService(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    const service = mockServices.find(s => s.id === order.serviceId);
    setSelectedService(service || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (order: Order) => {
    if (confirm(`Are you sure you want to delete this order?`)) {
      setOrders(orders.filter(o => o.id !== order.id));
      toast({
        title: "Order deleted",
        description: "The order has been removed.",
      });
    }
  };

  const handleSave = (formData: FormData) => {
    const client = mockUsers.find(u => u.id === formData.get('clientId'));
    const service = mockServices.find(s => s.id === formData.get('serviceId'));
    const paymentMethod = mockPaymentMethods.find(pm => pm.id === formData.get('paymentMethodId'));

    const orderData = {
      id: editingOrder?.id || Date.now().toString(),
      clientId: formData.get('clientId') as string,
      clientName: client?.name || '',
      serviceId: formData.get('serviceId') as string,
      serviceName: service?.name || '',
      startDate: formData.get('startDate') as string,
      endDate: service?.hasExpiration ? formData.get('endDate') as string : undefined,
      price: parseFloat(formData.get('price') as string),
      cost: parseFloat(formData.get('cost') as string),
      paymentMethodId: formData.get('paymentMethodId') as string,
      paymentMethod: paymentMethod?.type || '',
      status: 'active' as const
    };

    if (editingOrder) {
      setOrders(orders.map(o => o.id === editingOrder.id ? orderData : o));
      toast({
        title: "Order updated",
        description: "The order has been updated.",
      });
    } else {
      setOrders([...orders, orderData]);
      toast({
        title: "Order created",
        description: "A new order has been created.",
      });
    }

    setIsDialogOpen(false);
    setEditingOrder(null);
    setSelectedService(null);
  };

  return (
    <Layout title="Orders" subtitle="Manage service orders and subscriptions">
      <DataTable
        title="Order Management"
        data={orders}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search orders..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Order' : 'Create New Order'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.target as HTMLFormElement));
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <Select name="clientId" defaultValue={editingOrder?.clientId || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceId">Service</Label>
                <Select 
                  name="serviceId" 
                  defaultValue={editingOrder?.serviceId || ''}
                  onValueChange={(value) => {
                    const service = mockServices.find(s => s.id === value);
                    setSelectedService(service || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={editingOrder?.startDate || ''}
                  required
                />
              </div>

              {(selectedService?.hasExpiration || editingOrder?.endDate) && (
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={editingOrder?.endDate || ''}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingOrder?.price || ''}
                  placeholder="15.99"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue={editingOrder?.cost || ''}
                  placeholder="12.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Payment Method</Label>
              <Select name="paymentMethodId" defaultValue={editingOrder?.paymentMethodId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {mockPaymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="admin-button-primary">
                {editingOrder ? 'Update' : 'Create'} Order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}