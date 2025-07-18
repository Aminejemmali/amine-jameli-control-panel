import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, User } from "lucide-react";

interface User {
  id: string;
  clientName: string;
  clientEmail: string;
  note?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
}

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    clientName: 'John Doe',
    clientEmail: 'john.doe@email.com',
    note: 'VIP customer, prefers Netflix services',
    joinDate: '2024-01-15',
    totalOrders: 12,
    totalSpent: 240.50
  },
  {
    id: '2',
    clientName: 'Jane Smith',
    clientEmail: 'jane.smith@email.com',
    note: 'Business client, bulk orders',
    joinDate: '2024-02-22',
    totalOrders: 8,
    totalSpent: 156.80
  },
  {
    id: '3',
    clientName: 'Mike Johnson',
    clientEmail: 'mike.johnson@email.com',
    joinDate: '2024-03-10',
    totalOrders: 5,
    totalSpent: 89.25
  }
];

export default function Users() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const columns = [
    {
      key: 'clientName',
      label: 'Name',
      render: (name: string, user: User) => (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User size={16} className="text-primary-foreground" />
          </div>
          <span className="font-medium">{name}</span>
        </div>
      )
    },
    {
      key: 'clientEmail',
      label: 'Email',
      render: (email: string) => (
        <div className="flex items-center space-x-2">
          <Mail size={16} className="text-muted-foreground" />
          <span>{email}</span>
        </div>
      )
    },
    { key: 'joinDate', label: 'Join Date' },
    { key: 'totalOrders', label: 'Orders' },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      render: (amount: number) => `$${amount.toFixed(2)}`
    },
    {
      key: 'note',
      label: 'Note',
      render: (note: string) => note ? (
        <span className="text-sm text-muted-foreground truncate max-w-32">
          {note}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    }
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.clientName}?`)) {
      setUsers(users.filter(u => u.id !== user.id));
      toast({
        title: "User deleted",
        description: `${user.clientName} has been removed.`,
      });
    }
  };

  const handleSave = (formData: FormData) => {
    const userData = {
      id: editingUser?.id || Date.now().toString(),
      clientName: formData.get('clientName') as string,
      clientEmail: formData.get('clientEmail') as string,
      note: formData.get('note') as string,
      joinDate: editingUser?.joinDate || new Date().toISOString().split('T')[0],
      totalOrders: editingUser?.totalOrders || 0,
      totalSpent: editingUser?.totalSpent || 0
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? userData : u));
      toast({
        title: "User updated",
        description: `${userData.clientName} has been updated.`,
      });
    } else {
      setUsers([...users, userData]);
      toast({
        title: "User created",
        description: `${userData.clientName} has been added.`,
      });
    }

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <Layout title="Users" subtitle="Manage your clients and customers">
      <DataTable
        title="Client Management"
        data={users}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search users..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.target as HTMLFormElement));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="clientName">Full Name</Label>
              <Input
                id="clientName"
                name="clientName"
                defaultValue={editingUser?.clientName || ''}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email Address</Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                defaultValue={editingUser?.clientEmail || ''}
                placeholder="john.doe@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                name="note"
                defaultValue={editingUser?.note || ''}
                placeholder="Add any notes about this client..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="admin-button-primary">
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}