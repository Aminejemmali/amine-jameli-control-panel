import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DataTable } from "@/components/DataTable";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, User } from "lucide-react";
import { 
  subscribeToUsers, 
  addUser as addUserToFirestore, 
  updateUser as updateUserInFirestore, 
  deleteUser as deleteUserFromFirestore 
} from "@/services/usersService";

interface User {
  id: string;
  clientName: string;
  clientEmail?: string;
  note?: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToUsers((usersData) => {
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Layout title="Users" subtitle="Manage your clients and customers">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading users..." />
        </div>
      </Layout>
    );
  }

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

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.clientName}?`)) {
      try {
        await deleteUserFromFirestore(user.id);
        toast({
          title: "User deleted",
          description: `${user.clientName} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const userData = {
      clientName: formData.get('clientName') as string,
      clientEmail: formData.get('clientEmail') as string,
      note: formData.get('note') as string
    };

    try {
      if (editingUser) {
        await updateUserInFirestore(editingUser.id, userData);
        toast({
          title: "User updated",
          description: `${userData.clientName} has been updated.`,
        });
      } else {
        await addUserToFirestore(userData);
        toast({
          title: "User created",
          description: `${userData.clientName} has been added.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save user.",
        variant: "destructive"
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
              <Label htmlFor="clientEmail">Email Address (Optional)</Label>
              <Input
                id="clientEmail"
                name="clientEmail"
                type="email"
                defaultValue={editingUser?.clientEmail || ''}
                placeholder="john.doe@email.com"
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