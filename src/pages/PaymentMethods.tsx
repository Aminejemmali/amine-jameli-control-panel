import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";
import { useFirestoreCollection } from "@/hooks/useFirestore";
import { COLLECTIONS } from "@/lib/firebaseConfig";

interface PaymentMethod {
  id: string;
  type: string;
  logo: string;
  description?: string;
  exampleLast4: string;
}

// Mock data
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'Visa',
    logo: 'https://cdn.worldvectorlogo.com/logos/visa-logo.svg',
    description: 'Credit and debit cards',
    exampleLast4: '1234'
  },
  {
    id: '2',
    type: 'PayPal',
    logo: 'https://cdn.worldvectorlogo.com/logos/paypal-2.svg',
    description: 'PayPal payments',
    exampleLast4: '8762'
  },
  {
    id: '3',
    type: 'Bank Transfer',
    logo: 'https://cdn.worldvectorlogo.com/logos/bank-2.svg',
    description: 'Direct bank transfers',
    exampleLast4: '5678'
  },
  {
    id: '4',
    type: 'Mastercard',
    logo: 'https://cdn.worldvectorlogo.com/logos/mastercard-2.svg',
    description: 'Mastercard payments',
    exampleLast4: '9012'
  }
];

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

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

  const handleDelete = (paymentMethod: PaymentMethod) => {
    if (confirm(`Are you sure you want to delete ${paymentMethod.type}?`)) {
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== paymentMethod.id));
      toast({
        title: "Payment method deleted",
        description: `${paymentMethod.type} has been removed.`,
      });
    }
  };

  const handleSave = (formData: FormData) => {
    const paymentMethodData = {
      id: editingPaymentMethod?.id || Date.now().toString(),
      type: formData.get('type') as string,
      logo: formData.get('logo') as string,
      description: formData.get('description') as string,
      exampleLast4: formData.get('exampleLast4') as string
    };

    if (editingPaymentMethod) {
      setPaymentMethods(paymentMethods.map(pm => 
        pm.id === editingPaymentMethod.id ? paymentMethodData : pm
      ));
      toast({
        title: "Payment method updated",
        description: `${paymentMethodData.type} has been updated.`,
      });
    } else {
      setPaymentMethods([...paymentMethods, paymentMethodData]);
      toast({
        title: "Payment method created",
        description: `${paymentMethodData.type} has been added.`,
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