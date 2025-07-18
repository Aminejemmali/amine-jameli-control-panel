import { useState, useEffect } from "react";
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
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { COLLECTIONS } from "@/lib/firebaseConfig";
import { formatCurrency, formatDate } from "@/lib/utils";

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


export default function Orders() {
  const { data: orders, loading: ordersLoading, addDocument: addOrder, updateDocument: updateOrder, deleteDocument: deleteOrder } = useFirestoreCollection(COLLECTIONS.ORDERS);
  const { data: services, loading: servicesLoading } = useFirestoreCollection(COLLECTIONS.SERVICES);
  const { data: users, loading: usersLoading } = useFirestoreCollection(COLLECTIONS.USERS);
  const { data: paymentMethods, loading: paymentMethodsLoading } = useFirestoreCollection(COLLECTIONS.PAYMENT_METHODS);
  
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const { toast } = useToast();

  // Loading state
  if (ordersLoading || servicesLoading || usersLoading || paymentMethodsLoading) {
    return (
      <Layout title="Orders" subtitle="Manage service orders">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

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
          <span className="font-medium">{formatCurrency(price)}</span>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (cost: number) => (
        <span className="text-muted-foreground">{formatCurrency(cost)}</span>
      )
    },
    {
      key: 'profit',
      label: 'Profit',
      render: (_, order: Order) => {
        const profit = order.price - order.cost;
        return (
          <span className={`font-medium ${profit > 0 ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(profit)}
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
    const service = services.find(s => s.id === order.serviceId);
    setSelectedService(service || null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (order: Order) => {
    if (confirm(`Are you sure you want to delete this order?`)) {
      try {
        await deleteOrder(order.id);
        toast({
          title: "Order deleted",
          description: "The order has been removed.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete order.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const client = users.find(u => u.id === formData.get('clientId'));
    const service = services.find(s => s.id === formData.get('serviceId'));
    const paymentMethod = paymentMethods.find(pm => pm.id === formData.get('paymentMethodId'));

    const orderData = {
      clientId: formData.get('clientId') as string,
      clientName: client?.clientName || '',
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

    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, orderData);
        toast({
          title: "Order updated",
          description: "The order has been updated.",
        });
      } else {
        await addOrder(orderData);
        toast({
          title: "Order created",
          description: "A new order has been created.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save order.",
        variant: "destructive"
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
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.clientName}
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
                    const service = services.find(s => s.id === value);
                    setSelectedService(service || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(service => (
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
                  {paymentMethods.map(method => (
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