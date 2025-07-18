import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  image: string;
  hasExpiration: boolean;
  status: 'active' | 'inactive' | 'paused';
}

// Mock data
const mockServices: Service[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    image: 'https://cdn.worldvectorlogo.com/logos/netflix-2.svg',
    hasExpiration: true,
    status: 'active'
  },
  {
    id: '2',
    name: 'ChatGPT Plus',
    image: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg',
    hasExpiration: true,
    status: 'active'
  },
  {
    id: '3',
    name: 'Canva Pro',
    image: 'https://cdn.worldvectorlogo.com/logos/canva-1.svg',
    hasExpiration: true,
    status: 'paused'
  },
  {
    id: '4',
    name: 'Spotify Premium',
    image: 'https://cdn.worldvectorlogo.com/logos/spotify-2.svg',
    hasExpiration: true,
    status: 'active'
  }
];

export default function Services() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const columns = [
    {
      key: 'image',
      label: 'Logo',
      render: (image: string, service: Service) => (
        <img src={image} alt={service.name} className="w-8 h-8 object-contain" />
      )
    },
    { key: 'name', label: 'Service Name' },
    {
      key: 'hasExpiration',
      label: 'Expires',
      render: (hasExpiration: boolean) => (
        <Badge variant={hasExpiration ? "default" : "secondary"}>
          {hasExpiration ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (status: string) => (
        <Badge
          variant={
            status === 'active' ? 'default' :
            status === 'paused' ? 'secondary' : 'destructive'
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    }
  ];

  const handleAdd = () => {
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    if (confirm(`Are you sure you want to delete ${service.name}?`)) {
      setServices(services.filter(s => s.id !== service.id));
      toast({
        title: "Service deleted",
        description: `${service.name} has been removed.`,
      });
    }
  };

  const handleSave = (formData: FormData) => {
    const serviceData = {
      id: editingService?.id || Date.now().toString(),
      name: formData.get('name') as string,
      image: formData.get('image') as string,
      hasExpiration: formData.get('hasExpiration') === 'on',
      status: formData.get('status') as 'active' | 'inactive' | 'paused'
    };

    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? serviceData : s));
      toast({
        title: "Service updated",
        description: `${serviceData.name} has been updated.`,
      });
    } else {
      setServices([...services, serviceData]);
      toast({
        title: "Service created",
        description: `${serviceData.name} has been added.`,
      });
    }

    setIsDialogOpen(false);
    setEditingService(null);
  };

  return (
    <Layout title="Services" subtitle="Manage your digital services and subscriptions">
      <DataTable
        title="Digital Services"
        data={services}
        columns={columns}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search services..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
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
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingService?.name || ''}
                placeholder="e.g., Netflix Premium"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Logo URL</Label>
              <Input
                id="image"
                name="image"
                type="url"
                defaultValue={editingService?.image || ''}
                placeholder="https://example.com/logo.svg"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasExpiration"
                name="hasExpiration"
                defaultChecked={editingService?.hasExpiration || false}
              />
              <Label htmlFor="hasExpiration">Service has expiration date</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={editingService?.status || 'active'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="admin-button-primary">
                {editingService ? 'Update' : 'Create'} Service
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}