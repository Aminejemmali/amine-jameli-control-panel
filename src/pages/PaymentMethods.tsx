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
import { CreditCard } from "lucide-react";
import { 
  subscribeToPaymentMethods, 
  addPaymentMethod as addPaymentMethodToFirestore, 
  updatePaymentMethod as updatePaymentMethodInFirestore, 
  deletePaymentMethod as deletePaymentMethodFromFirestore 
} from "@/services/paymentService";

interface PaymentMethod {
  id: string;
  type: string;
  logo: string;
  description?: string;
  exampleLast4: string;
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToPaymentMethods((paymentMethodsData) => {
      setPaymentMethods(paymentMethodsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Layout title="Payment Methods" subtitle="Manage accepted payment methods">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading payment methods..." />
        </div>
      </Layout>
    );
  }

  const columns = [
    {
      key: 'logo',
      label: 'Logo',
      render: (logo: string, method: PaymentMethod) => (
        <img src={logo} alt={method.type} className="w-10 h-6 object-contain" />
      )
    },
    {
      key: 'type',
      label: 'Payment Type',
      render: (type: string) => (
        <div className="flex items-center space-x-2">
          <CreditCard size={16} className="text-muted-foreground" />
          <span className="font-medium">{type}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (description: string) => description || (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      key: 'exampleLast4',
      label: 'Example',
      render: (last4: string) => (
        <span className="font-mono text-sm">••••{last4}</span>
      )
    }
  ];

  const handleAdd = () => {
    setEditingPaymentMethod(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setIsDialogOpen(true);
  };

  const handleDelete = async (paymentMethod: PaymentMethod) => {
    if (confirm(`Are you sure you want to delete ${paymentMethod.type}?`)) {
      try {
        await deletePaymentMethodFromFirestore(paymentMethod.id);
        toast({
          title: "Payment method deleted",
          description: `${paymentMethod.type} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete payment method.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = async (formData: FormData) => {
    const paymentMethodData = {
      type: formData.get('type') as string,
      logo: formData.get('logo') as string,
      description: formData.get('description') as string,
      exampleLast4: formData.get('exampleLast4') as string
    };

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethodInFirestore(editingPaymentMethod.id, paymentMethodData);
        toast({
          title: "Payment method updated",
          description: `${paymentMethodData.type} has been updated.`,
        });
      } else {
        await addPaymentMethodToFirestore(paymentMethodData);
        toast({
          title: "Payment method created",
          description: `${paymentMethodData.type} has been added.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment method.",
        variant: "destructive"
      });
    }

    setIsDialogOpen(false);
    setEditingPaymentMethod(null);
  };

  return (
    <Layout title="Payment Methods" subtitle="Manage accepted payment methods">
      <DataTable
        title="Payment Methods"
        data={paymentMethods}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search payment methods..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
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
              <Label htmlFor="type">Payment Type</Label>
              <Input
                id="type"
                name="type"
                defaultValue={editingPaymentMethod?.type || ''}
                placeholder="e.g., Visa, PayPal, Bank Transfer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                name="logo"
                type="url"
                defaultValue={editingPaymentMethod?.logo || ''}
                placeholder="https://example.com/logo.svg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingPaymentMethod?.description || ''}
                placeholder="Brief description of this payment method..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exampleLast4">Example Last 4 Digits</Label>
              <Input
                id="exampleLast4"
                name="exampleLast4"
                defaultValue={editingPaymentMethod?.exampleLast4 || ''}
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
              <p className="text-xs text-muted-foreground">
                For display purposes (e.g., ••••1234)
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="admin-button-primary">
                {editingPaymentMethod ? 'Update' : 'Create'} Payment Method
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}