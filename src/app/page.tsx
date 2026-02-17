'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Search, FileText, Truck, Wrench, Settings, Trash2, 
  Eye, Printer, Upload, Download, CheckCircle, Clock, AlertCircle,
  Filter, Droplets, Package, FileCheck, Edit, Save, RefreshCw,
  Zap, AlertTriangle, XCircle, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Machine {
  id: number;
  ecNo: string | null;
  brand: string;
  type: string;
  modelNo: string | null;
  registrationNo: string;
  capacity: string | null;
  yom: number | null;
}

interface IssuedMaterial {
  id: number;
  date: string;
  mrnNo: string;
  description: string;
  unit: string | null;
  qty: number;
  vehicleProject: string;
  remark: string | null;
  price: number | null;
  total: number | null;
  category: 'MRN_ITEM' | 'LUBRICANT' | 'COMMON_ITEM' | 'FILTER';
  isUsed: boolean;
}

interface JobCardItem {
  issuedMaterialId: number;
  itemType: 'MRN_ITEM' | 'LUBRICANT' | 'COMMON_ITEM' | 'FILTER';
  issuedMaterial: IssuedMaterial;
}

interface OutsideWork {
  id?: number;
  date: string;
  description: string;
  cost: number;
}

interface JobCard {
  id: number;
  jobCardNo: string;
  vehicleRegNo: string;
  companyCode: string | null;
  vehicleMachineryMeter: number | null;
  repairType: string | null;
  expectedCompletionDate: string | null;
  driverOperatorName: string | null;
  driverOperatorContact: string | null;
  bcdNo: string | null;
  jobDescription: string | null;
  jobStartDate: string | null;
  jobCompletedDate: string | null;
  supervisorName: string | null;
  totalSparePartsCost: number;
  totalManpowerCost: number;
  outsideWorkCost: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  items: JobCardItem[];
  outsideWorks: OutsideWork[];
  machine?: Machine | null;
}

type MainTab = 'dashboard' | 'vehicles' | 'autogenerate' | 'mrn' | 'lubricants' | 'common' | 'filters' | 'jobcards' | 'create' | 'view';

// Category configuration
const categoryConfig = {
  MRN_ITEM: { label: 'MRN Items', color: 'bg-blue-100 text-blue-800', icon: Package, description: 'Issued Materials' },
  LUBRICANT: { label: 'Lubricants', color: 'bg-amber-100 text-amber-800', icon: Droplets, description: 'Oils, Grease, Hydraulic Fluids' },
  COMMON_ITEM: { label: 'Common Items', color: 'bg-green-100 text-green-800', icon: Settings, description: 'General/Special Items' },
  FILTER: { label: 'Filters', color: 'bg-purple-100 text-purple-800', icon: Filter, description: 'Fuel, Air, Hydraulic Filters' }
};

const statusConfig = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export default function JobCardApp() {
  // Main tab state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  
  // Data states
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<IssuedMaterial[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  
  // Search states
  const [machineSearch, setMachineSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [jobCardSearch, setJobCardSearch] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ 
    totalMachines: 0, 
    totalMaterials: 0, 
    totalJobCards: 0, 
    pendingJobCards: 0,
    unusedMaterials: 0,
    usedMaterials: 0
  });
  
  // Dialog states
  const [machineDialogOpen, setMachineDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<IssuedMaterial | null>(null);
  
  // Auto-generate states
  const [groupedMaterials, setGroupedMaterials] = useState<{[key: string]: IssuedMaterial[]}>({});
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [autoGenerateDialogOpen, setAutoGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Job card creation state
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<JobCardItem[]>([]);
  const [outsideWorks, setOutsideWorks] = useState<OutsideWork[]>([]);
  const [formData, setFormData] = useState({
    companyCode: '',
    vehicleMachineryMeter: '',
    repairType: '',
    expectedCompletionDate: '',
    driverOperatorName: '',
    driverOperatorContact: '',
    bcdNo: '',
    jobDescription: '',
    jobStartDate: '',
    jobCompletedDate: '',
    supervisorName: '',
    totalManpowerCost: '',
    status: 'DRAFT' as JobCard['status']
  });
  
  // Form states for adding/editing
  const [machineForm, setMachineForm] = useState({
    ecNo: '', brand: '', type: '', modelNo: '', registrationNo: '', capacity: '', yom: ''
  });
  
  const [materialForm, setMaterialForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mrnNo: '', description: '', unit: 'Nos', qty: '1', vehicleProject: '', remark: '', price: '', total: '', category: 'MRN_ITEM' as IssuedMaterial['category']
  });

  // Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [machinesRes, materialsRes, jobCardsRes] = await Promise.all([
          fetch('/api/machines?limit=1000'),
          fetch('/api/materials?limit=1000'),
          fetch('/api/job-cards?limit=100')
        ]);
        const machinesData = await machinesRes.json();
        const materialsData = await materialsRes.json();
        const jobCardsData = await jobCardsRes.json();
        
        setMachines(machinesData.machines || []);
        setMaterials(materialsData.materials || []);
        setJobCards(jobCardsData.jobCards || []);
        
        const mats = materialsData.materials || [];
        const unused = mats.filter((m: IssuedMaterial) => !m.isUsed);
        const used = mats.filter((m: IssuedMaterial) => m.isUsed);
        
        // Group unused materials by vehicle
        const grouped: {[key: string]: IssuedMaterial[]} = {};
        for (const m of unused) {
          const vehicle = m.vehicleProject.trim();
          if (!grouped[vehicle]) grouped[vehicle] = [];
          grouped[vehicle].push(m);
        }
        setGroupedMaterials(grouped);
        
        setStats({
          totalMachines: machinesData.total || 0,
          totalMaterials: materialsData.total || 0,
          totalJobCards: jobCardsData.total || 0,
          pendingJobCards: jobCardsData.jobCards?.filter((jc: JobCard) => jc.status === 'DRAFT' || jc.status === 'IN_PROGRESS').length || 0,
          unusedMaterials: unused.length,
          usedMaterials: used.length
        });
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Refresh function
  const refreshData = async () => {
    try {
      const [machinesRes, materialsRes, jobCardsRes] = await Promise.all([
        fetch('/api/machines?limit=1000'),
        fetch('/api/materials?limit=1000'),
        fetch('/api/job-cards?limit=100')
      ]);
      const machinesData = await machinesRes.json();
      const materialsData = await materialsRes.json();
      const jobCardsData = await jobCardsRes.json();
      
      setMachines(machinesData.machines || []);
      setMaterials(materialsData.materials || []);
      setJobCards(jobCardsData.jobCards || []);
      
      const mats = materialsData.materials || [];
      const unused = mats.filter((m: IssuedMaterial) => !m.isUsed);
      const used = mats.filter((m: IssuedMaterial) => m.isUsed);
      
      const grouped: {[key: string]: IssuedMaterial[]} = {};
      for (const m of unused) {
        const vehicle = m.vehicleProject.trim();
        if (!grouped[vehicle]) grouped[vehicle] = [];
        grouped[vehicle].push(m);
      }
      setGroupedMaterials(grouped);
      
      setStats({
        totalMachines: machinesData.total || 0,
        totalMaterials: materialsData.total || 0,
        totalJobCards: jobCardsData.total || 0,
        pendingJobCards: jobCardsData.jobCards?.filter((jc: JobCard) => jc.status === 'DRAFT' || jc.status === 'IN_PROGRESS').length || 0,
        unusedMaterials: unused.length,
        usedMaterials: used.length
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Filter functions
  const getFilteredMachines = () => {
    if (!machineSearch) return machines;
    const search = machineSearch.toLowerCase();
    return machines.filter(m => 
      m.registrationNo.toLowerCase().includes(search) ||
      (m.ecNo && m.ecNo.toLowerCase().includes(search)) ||
      m.brand.toLowerCase().includes(search) ||
      m.type.toLowerCase().includes(search)
    );
  };

  const getFilteredMaterials = (category: IssuedMaterial['category']) => {
    let filtered = materials.filter(m => m.category === category);
    if (materialSearch) {
      const search = materialSearch.toLowerCase();
      filtered = filtered.filter(m => 
        m.description.toLowerCase().includes(search) ||
        m.mrnNo.toLowerCase().includes(search) ||
        m.vehicleProject.toLowerCase().includes(search)
      );
    }
    return filtered;
  };

  const getFilteredJobCards = () => {
    if (!jobCardSearch) return jobCards;
    const search = jobCardSearch.toLowerCase();
    return jobCards.filter(jc => 
      jc.jobCardNo.toLowerCase().includes(search) ||
      jc.vehicleRegNo.toLowerCase().includes(search) ||
      (jc.driverOperatorName && jc.driverOperatorName.toLowerCase().includes(search))
    );
  };

  // Machine CRUD
  const handleAddMachine = async () => {
    if (!machineForm.registrationNo) {
      toast.error('Registration number is required');
      return;
    }
    try {
      const res = await fetch('/api/machines/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machineForm)
      });
      if (res.ok) {
        toast.success('Machine added successfully');
        setMachineDialogOpen(false);
        setMachineForm({ ecNo: '', brand: '', type: '', modelNo: '', registrationNo: '', capacity: '', yom: '' });
        refreshData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add machine');
      }
    } catch (error) {
      toast.error('Failed to add machine');
    }
  };

  const handleEditMachine = async () => {
    if (!editingMachine) return;
    try {
      const res = await fetch(`/api/machines/${editingMachine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machineForm)
      });
      if (res.ok) {
        toast.success('Machine updated successfully');
        setMachineDialogOpen(false);
        setEditingMachine(null);
        setMachineForm({ ecNo: '', brand: '', type: '', modelNo: '', registrationNo: '', capacity: '', yom: '' });
        refreshData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update machine');
      }
    } catch (error) {
      toast.error('Failed to update machine');
    }
  };

  const handleDeleteMachine = async (id: number) => {
    if (!confirm('Are you sure you want to delete this machine?')) return;
    try {
      const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Machine deleted');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to delete machine');
    }
  };

  const openEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setMachineForm({
      ecNo: machine.ecNo || '', brand: machine.brand, type: machine.type,
      modelNo: machine.modelNo || '', registrationNo: machine.registrationNo,
      capacity: machine.capacity || '', yom: machine.yom?.toString() || ''
    });
    setMachineDialogOpen(true);
  };

  // Material CRUD
  const handleAddMaterial = async () => {
    if (!materialForm.mrnNo || !materialForm.description) {
      toast.error('MRN No and Description are required');
      return;
    }
    try {
      const res = await fetch('/api/materials/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          qty: parseInt(materialForm.qty) || 1,
          price: parseFloat(materialForm.price) || null,
          total: parseFloat(materialForm.total) || null
        })
      });
      if (res.ok) {
        toast.success('Material added successfully');
        setMaterialDialogOpen(false);
        setMaterialForm({ date: new Date().toISOString().split('T')[0], mrnNo: '', description: '', unit: 'Nos', qty: '1', vehicleProject: '', remark: '', price: '', total: '', category: 'MRN_ITEM' });
        refreshData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add material');
      }
    } catch (error) {
      toast.error('Failed to add material');
    }
  };

  const handleEditMaterial = async () => {
    if (!editingMaterial) return;
    try {
      const res = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...materialForm,
          qty: parseInt(materialForm.qty) || 1,
          price: parseFloat(materialForm.price) || null,
          total: parseFloat(materialForm.total) || null
        })
      });
      if (res.ok) {
        toast.success('Material updated successfully');
        setMaterialDialogOpen(false);
        setEditingMaterial(null);
        setMaterialForm({ date: new Date().toISOString().split('T')[0], mrnNo: '', description: '', unit: 'Nos', qty: '1', vehicleProject: '', remark: '', price: '', total: '', category: 'MRN_ITEM' });
        refreshData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update material');
      }
    } catch (error) {
      toast.error('Failed to update material');
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Material deleted');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to delete material');
    }
  };

  const openEditMaterial = (material: IssuedMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      date: new Date(material.date).toISOString().split('T')[0],
      mrnNo: material.mrnNo, description: material.description,
      unit: material.unit || 'Nos', qty: material.qty.toString(),
      vehicleProject: material.vehicleProject, remark: material.remark || '',
      price: material.price?.toString() || '', total: material.total?.toString() || '',
      category: material.category
    });
    setMaterialDialogOpen(true);
  };

  // Import handlers
  const handleImportMachines = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    try {
      const res = await fetch('/api/machines/import', { method: 'POST', body: formDataObj });
      const data = await res.json();
      if (data.success) {
        toast.success(`Imported ${data.imported} machines, skipped ${data.skipped}`);
        refreshData();
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    }
    e.target.value = '';
  };

  const handleImportMaterials = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    try {
      const res = await fetch('/api/materials/import', { method: 'POST', body: formDataObj });
      const data = await res.json();
      if (data.success) {
        toast.success(`Imported ${data.imported} materials, skipped ${data.skipped}`);
        refreshData();
      } else {
        toast.error(data.error || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    }
    e.target.value = '';
  };

  // Export handlers
  const handleExportMachines = () => window.open('/api/machines/export', '_blank');
  const handleExportMaterials = (category: IssuedMaterial['category']) => window.open(`/api/materials/export?category=${category}`, '_blank');

  // Auto-generate job cards
  const handleAutoGenerateAll = async () => {
    if (!confirm('This will create job cards for ALL unused materials grouped by vehicle. Continue?')) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/job-cards/auto-generate', { method: 'GET' });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Created ${data.totalJobCards} job cards successfully!`);
        setAutoGenerateDialogOpen(false);
        refreshData();
        setActiveTab('jobcards');
      } else {
        toast.error(data.error || 'Failed to generate job cards');
      }
    } catch (error) {
      toast.error('Failed to auto-generate job cards');
    }
    setIsGenerating(false);
  };

  const handleAutoGenerateSelected = async () => {
    if (selectedGroups.length === 0) {
      toast.error('Please select at least one vehicle group');
      return;
    }
    
    setIsGenerating(true);
    let created = 0;
    
    for (const vehicle of selectedGroups) {
      const mats = groupedMaterials[vehicle];
      if (!mats || mats.length === 0) continue;
      
      try {
        const res = await fetch('/api/job-cards/auto-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleRegNo: vehicle, materials: mats })
        });
        if (res.ok) created++;
      } catch (error) {
        console.error(`Failed to create job card for ${vehicle}:`, error);
      }
    }
    
    toast.success(`Created ${created} job cards successfully!`);
    setSelectedGroups([]);
    setAutoGenerateDialogOpen(false);
    setIsGenerating(false);
    refreshData();
    setActiveTab('jobcards');
  };

  const toggleGroupSelection = (vehicle: string) => {
    setSelectedGroups(prev => 
      prev.includes(vehicle) 
        ? prev.filter(v => v !== vehicle)
        : [...prev, vehicle]
    );
  };

  const selectAllGroups = () => {
    setSelectedGroups(Object.keys(groupedMaterials));
  };

  const deselectAllGroups = () => {
    setSelectedGroups([]);
  };

  // Job card functions
  const handleItemToggle = (material: IssuedMaterial) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.issuedMaterialId === material.id);
      if (exists) return prev.filter(item => item.issuedMaterialId !== material.id);
      return [...prev, { issuedMaterialId: material.id, itemType: material.category, issuedMaterial: material }];
    });
  };

  const calculateTotal = () => {
    const sparePartsCost = selectedItems.reduce((sum, item) => sum + (item.issuedMaterial.total || 0), 0);
    const manpowerCost = parseFloat(formData.totalManpowerCost) || 0;
    const outsideWorkCost = outsideWorks.reduce((sum, work) => sum + (work.cost || 0), 0);
    const subtotal = sparePartsCost + manpowerCost + outsideWorkCost;
    const sundryWorkshopCost = subtotal * 0.10; // 10% of bill value
    const total = subtotal + sundryWorkshopCost;
    return { sparePartsCost, manpowerCost, outsideWorkCost, subtotal, sundryWorkshopCost, total };
  };

  const saveJobCard = async () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    try {
      const totals = calculateTotal();
      const payload = {
        vehicleRegNo: selectedVehicle, ...formData,
        vehicleMachineryMeter: parseFloat(formData.vehicleMachineryMeter) || null,
        totalManpowerCost: totals.manpowerCost, totalSparePartsCost: totals.sparePartsCost,
        outsideWorkCost: totals.outsideWorkCost,
        items: selectedItems.map(item => ({ issuedMaterialId: item.issuedMaterialId, itemType: item.itemType })),
        outsideWorks: outsideWorks.map(w => ({ ...w, date: w.date || new Date().toISOString() }))
      };
      const res = await fetch('/api/job-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Job card created successfully!');
        resetJobCardForm();
        refreshData();
        setActiveTab('jobcards');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create job card');
      }
    } catch (error) {
      toast.error('Failed to create job card');
    }
  };

  const resetJobCardForm = () => {
    setSelectedVehicle('');
    setSelectedItems([]);
    setOutsideWorks([]);
    setFormData({
      companyCode: '', vehicleMachineryMeter: '', repairType: '', expectedCompletionDate: '',
      driverOperatorName: '', driverOperatorContact: '', bcdNo: '', jobDescription: '',
      jobStartDate: '', jobCompletedDate: '', supervisorName: '', totalManpowerCost: '', status: 'DRAFT'
    });
  };

  const viewJobCard = (jobCard: JobCard) => {
    setSelectedJobCard(jobCard);
    setActiveTab('view');
  };

  const deleteJobCard = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job card?')) return;
    try {
      const res = await fetch(`/api/job-cards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Job card deleted');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to delete job card');
    }
  };

  const updateJobCardStatus = async (id: number, status: JobCard['status']) => {
    try {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Job card marked as ${statusConfig[status].label}`);
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const selectedMachine = machines.find(m => m.registrationNo === selectedVehicle);
  const totals = calculateTotal();

  // Render asset table component
  const renderAssetTable = (category: IssuedMaterial['category'], title: string, icon: React.ReactNode, description: string) => {
    const filteredMaterials = getFilteredMaterials(category);
    const config = categoryConfig[category];
    const unusedCount = filteredMaterials.filter(m => !m.isUsed).length;
    const usedCount = filteredMaterials.filter(m => m.isUsed).length;
    
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.color}`}>{icon}</div>
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-gray-500">{description} • {filteredMaterials.length} records</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search..." value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} className="pl-10 w-48" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setMaterialSearch('')}><RefreshCw className="w-4 h-4" /></Button>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportMaterials} className="hidden" id={`import-${category}`} />
            <Button variant="outline" size="sm" onClick={() => document.getElementById(`import-${category}`)?.click()}><Upload className="w-4 h-4 mr-1" />Import</Button>
            <Button variant="outline" size="sm" onClick={() => handleExportMaterials(category)}><Download className="w-4 h-4 mr-1" />Export</Button>
            <Dialog open={materialDialogOpen} onOpenChange={(open) => { setMaterialDialogOpen(open); if (!open) { setEditingMaterial(null); setMaterialForm({ date: new Date().toISOString().split('T')[0], mrnNo: '', description: '', unit: 'Nos', qty: '1', vehicleProject: '', remark: '', price: '', total: '', category }); }}}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add New</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editingMaterial ? 'Edit' : 'Add'} {title}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div><Label>Date</Label><Input type="date" value={materialForm.date} onChange={(e) => setMaterialForm({...materialForm, date: e.target.value})} /></div>
                  <div><Label>MRN No. *</Label><Input value={materialForm.mrnNo} onChange={(e) => setMaterialForm({...materialForm, mrnNo: e.target.value})} /></div>
                  <div className="col-span-2"><Label>Description *</Label><Input value={materialForm.description} onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})} /></div>
                  <div><Label>Unit</Label><Select value={materialForm.unit} onValueChange={(v) => setMaterialForm({...materialForm, unit: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Nos">Nos</SelectItem><SelectItem value="Pcs">Pcs</SelectItem><SelectItem value="Sets">Sets</SelectItem><SelectItem value="Liters">Liters</SelectItem><SelectItem value="Meters">Meters</SelectItem><SelectItem value="Kg">Kg</SelectItem></SelectContent></Select></div>
                  <div><Label>Quantity</Label><Input type="number" value={materialForm.qty} onChange={(e) => setMaterialForm({...materialForm, qty: e.target.value})} /></div>
                  <div><Label>Vehicle / Project</Label><Input value={materialForm.vehicleProject} onChange={(e) => setMaterialForm({...materialForm, vehicleProject: e.target.value})} /></div>
                  <div><Label>Remark</Label><Input value={materialForm.remark} onChange={(e) => setMaterialForm({...materialForm, remark: e.target.value})} /></div>
                  <div><Label>Price</Label><Input type="number" value={materialForm.price} onChange={(e) => setMaterialForm({...materialForm, price: e.target.value})} /></div>
                  <div><Label>Total</Label><Input type="number" value={materialForm.total} onChange={(e) => setMaterialForm({...materialForm, total: e.target.value})} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
                  <Button onClick={editingMaterial ? handleEditMaterial : handleAddMaterial}><Save className="w-4 h-4 mr-1" />{editingMaterial ? 'Update' : 'Save'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex gap-4">
          <Badge className="bg-green-100 text-green-800 px-3 py-1"><CheckCircle className="w-3 h-3 mr-1" />{unusedCount} Available</Badge>
          <Badge className="bg-gray-100 text-gray-800 px-3 py-1"><CheckSquare className="w-3 h-3 mr-1" />{usedCount} In Job Card</Badge>
        </div>

        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-20">MRN No</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-16">Unit</TableHead>
                    <TableHead className="w-16">Qty</TableHead>
                    <TableHead className="w-28">Vehicle/Project</TableHead>
                    <TableHead className="w-20 text-right">Total</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material, index) => (
                    <TableRow key={material.id} className={!material.isUsed ? '' : 'bg-gray-50'}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{new Date(material.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="font-mono">{material.mrnNo}</TableCell>
                      <TableCell className="max-w-xs truncate" title={material.description}>{material.description}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>{material.qty}</TableCell>
                      <TableCell className="truncate" title={material.vehicleProject}>{material.vehicleProject}</TableCell>
                      <TableCell className="text-right">{material.total?.toFixed(2) || '-'}</TableCell>
                      <TableCell>
                        {material.isUsed ? (
                          <Badge className="bg-green-100 text-green-700"><CheckSquare className="w-3 h-3 mr-1" />In Job Card</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700"><Square className="w-3 h-3 mr-1" />Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditMaterial(material)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteMaterial(material.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMaterials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-500 py-12">
                        <div className="flex flex-col items-center gap-2">{icon}<p>No {title.toLowerCase()} found</p></div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg"><FileText className="w-5 h-5 text-primary" /></div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Job Card Management System</h1>
                <p className="text-xs text-gray-500">Edward and Christie - Vehicle & Machinery Maintenance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAutoGenerateDialogOpen(true)} className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                <Zap className="w-4 h-4 mr-2" />Auto Generate
              </Button>
              <Button onClick={() => { resetJobCardForm(); setActiveTab('create'); }}>
                <Plus className="w-4 h-4 mr-2" />New Job Card
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MainTab)} className="w-full">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/10">Dashboard</TabsTrigger>
              <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary/10"><Truck className="w-4 h-4 mr-1" />Vehicles</TabsTrigger>
              <TabsTrigger value="autogenerate" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800"><Zap className="w-4 h-4 mr-1" />Auto Generate</TabsTrigger>
              <TabsTrigger value="mrn" className="data-[state=active]:bg-primary/10"><Package className="w-4 h-4 mr-1" />MRN Items</TabsTrigger>
              <TabsTrigger value="lubricants" className="data-[state=active]:bg-primary/10"><Droplets className="w-4 h-4 mr-1" />Lubricants</TabsTrigger>
              <TabsTrigger value="common" className="data-[state=active]:bg-primary/10"><Settings className="w-4 h-4 mr-1" />Common</TabsTrigger>
              <TabsTrigger value="filters" className="data-[state=active]:bg-primary/10"><Filter className="w-4 h-4 mr-1" />Filters</TabsTrigger>
              <TabsTrigger value="jobcards" className="data-[state=active]:bg-primary/10"><FileText className="w-4 h-4 mr-1" />Job Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('vehicles')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Vehicles/Machinery</p><p className="text-3xl font-bold">{stats.totalMachines}</p></div>
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow bg-amber-50 border-amber-200" onClick={() => setActiveTab('autogenerate')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Pending Materials</p><p className="text-3xl font-bold text-amber-600">{stats.unusedMaterials}</p></div>
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('jobcards')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Job Cards</p><p className="text-3xl font-bold">{stats.totalJobCards}</p></div>
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Completed</p><p className="text-3xl font-bold text-green-600">{stats.usedMaterials}</p></div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col bg-green-50 border-green-200 text-green-700" onClick={() => setAutoGenerateDialogOpen(true)}>
                    <Zap className="w-6 h-6 mb-2" />Auto Generate Job Cards
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('vehicles')}>
                    <Truck className="w-6 h-6 mb-2" />Manage Vehicles
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('jobcards')}>
                    <FileText className="w-6 h-6 mb-2" />View Job Cards
                  </Button>
                  <Button className="h-20 flex-col" onClick={() => { resetJobCardForm(); setActiveTab('create'); }}>
                    <Plus className="w-6 h-6 mb-2" />Create Job Card
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Materials by Vehicle */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Pending Materials by Vehicle ({Object.keys(groupedMaterials).length} vehicles)
                </CardTitle>
                <Button onClick={() => setAutoGenerateDialogOpen(true)}><Zap className="w-4 h-4 mr-2" />Generate Job Cards</Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {Object.entries(groupedMaterials).slice(0, 10).map(([vehicle, mats]) => (
                      <div key={vehicle} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-medium">{vehicle}</p>
                            <p className="text-sm text-gray-500">{mats.length} items • Rs. {(mats.reduce((s, m) => s + (m.total || 0), 0) * 1.10).toFixed(2)} <span className="text-xs">(incl. 10%)</span></p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700">{mats.length} pending</Badge>
                      </div>
                    ))}
                    {Object.keys(groupedMaterials).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
                        <p>All materials have been assigned to job cards!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auto Generate Tab */}
        {activeTab === 'autogenerate' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100"><Zap className="w-5 h-5 text-green-600" /></div>
                <div>
                  <h2 className="text-xl font-bold">Auto Generate Job Cards</h2>
                  <p className="text-sm text-gray-500">{Object.keys(groupedMaterials).length} vehicles with {stats.unusedMaterials} pending materials</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={selectAllGroups}>Select All</Button>
                <Button variant="outline" onClick={deselectAllGroups}>Deselect All</Button>
                <Button onClick={handleAutoGenerateSelected} disabled={selectedGroups.length === 0 || isGenerating}>
                  {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Generate {selectedGroups.length} Job Cards
                </Button>
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleAutoGenerateAll} disabled={isGenerating}>
                  {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Generate ALL
                </Button>
              </div>
            </div>

            {/* Vehicle Groups */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Vehicle / Project</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedMaterials).map(([vehicle, mats]) => {
                        const categories = [...new Set(mats.map(m => m.category))];
                        const subtotal = mats.reduce((s, m) => s + (m.total || 0), 0);
                        const grandTotal = subtotal * 1.10; // With 10% sundry + workshop
                        return (
                          <TableRow key={vehicle} className={selectedGroups.includes(vehicle) ? 'bg-green-50' : ''}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedGroups.includes(vehicle)}
                                onCheckedChange={() => toggleGroupSelection(vehicle)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                {vehicle}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge>{mats.length} items</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {categories.map(cat => (
                                  <Badge key={cat} className={categoryConfig[cat].color}>{categoryConfig[cat].label}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">Rs. {grandTotal.toFixed(2)} <span className="text-xs text-gray-400">(incl. 10%)</span></TableCell>
                            <TableCell className="text-center">
                              <Button size="sm" onClick={async () => {
                                setIsGenerating(true);
                                const res = await fetch('/api/job-cards/auto-generate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ vehicleRegNo: vehicle, materials: mats })
                                });
                                if (res.ok) {
                                  toast.success(`Job card created for ${vehicle}`);
                                  refreshData();
                                }
                                setIsGenerating(false);
                              }} disabled={isGenerating}>
                                <Zap className="w-4 h-4 mr-1" />Create
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {Object.keys(groupedMaterials).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
                            <p className="text-gray-500">All materials have been assigned to job cards!</p>
                            <p className="text-sm text-gray-400">Import more materials or create job cards manually.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vehicles/Machinery Tab */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><Truck className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold">Vehicles / Machinery</h2>
                  <p className="text-sm text-gray-500">{machines.length} records</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search..." value={machineSearch} onChange={(e) => setMachineSearch(e.target.value)} className="pl-10 w-48" />
                </div>
                <Button variant="outline" size="sm" onClick={() => { setMachineSearch(''); refreshData(); }}><RefreshCw className="w-4 h-4" /></Button>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportMachines} className="hidden" id="import-machines" />
                <Button variant="outline" size="sm" onClick={() => document.getElementById('import-machines')?.click()}><Upload className="w-4 h-4 mr-1" />Import</Button>
                <Button variant="outline" size="sm" onClick={handleExportMachines}><Download className="w-4 h-4 mr-1" />Export</Button>
                <Dialog open={machineDialogOpen} onOpenChange={(open) => { setMachineDialogOpen(open); if (!open) { setEditingMachine(null); setMachineForm({ ecNo: '', brand: '', type: '', modelNo: '', registrationNo: '', capacity: '', yom: '' }); }}}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add New</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingMachine ? 'Edit' : 'Add'} Vehicle/Machinery</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div><Label>E&C No</Label><Input value={machineForm.ecNo} onChange={(e) => setMachineForm({...machineForm, ecNo: e.target.value})} /></div>
                      <div><Label>Registration No. *</Label><Input value={machineForm.registrationNo} onChange={(e) => setMachineForm({...machineForm, registrationNo: e.target.value})} /></div>
                      <div><Label>Brand</Label><Input value={machineForm.brand} onChange={(e) => setMachineForm({...machineForm, brand: e.target.value})} /></div>
                      <div><Label>Type</Label><Input value={machineForm.type} onChange={(e) => setMachineForm({...machineForm, type: e.target.value})} /></div>
                      <div><Label>Model No</Label><Input value={machineForm.modelNo} onChange={(e) => setMachineForm({...machineForm, modelNo: e.target.value})} /></div>
                      <div><Label>Capacity</Label><Input value={machineForm.capacity} onChange={(e) => setMachineForm({...machineForm, capacity: e.target.value})} /></div>
                      <div><Label>Year of Manufacture</Label><Input type="number" value={machineForm.yom} onChange={(e) => setMachineForm({...machineForm, yom: e.target.value})} /></div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setMachineDialogOpen(false)}>Cancel</Button>
                      <Button onClick={editingMachine ? handleEditMachine : handleAddMachine}><Save className="w-4 h-4 mr-1" />{editingMachine ? 'Update' : 'Save'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>E&C No</TableHead>
                        <TableHead>Registration No</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>YOM</TableHead>
                        <TableHead className="w-20 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredMachines().map((machine, index) => (
                        <TableRow key={machine.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{machine.ecNo || '-'}</TableCell>
                          <TableCell className="font-mono font-medium">{machine.registrationNo}</TableCell>
                          <TableCell>{machine.brand}</TableCell>
                          <TableCell>{machine.type}</TableCell>
                          <TableCell>{machine.modelNo || '-'}</TableCell>
                          <TableCell>{machine.capacity || '-'}</TableCell>
                          <TableCell>{machine.yom || '-'}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditMachine(machine)}><Edit className="w-4 h-4 text-blue-500" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteMachine(machine.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MRN Items Tab */}
        {activeTab === 'mrn' && renderAssetTable('MRN_ITEM', 'MRN Items', <Package className="w-5 h-5" />, 'Issued Materials')}

        {/* Lubricants Tab */}
        {activeTab === 'lubricants' && renderAssetTable('LUBRICANT', 'Lubricants', <Droplets className="w-5 h-5" />, 'Oils, Grease, Hydraulic Fluids')}

        {/* Common Items Tab */}
        {activeTab === 'common' && renderAssetTable('COMMON_ITEM', 'Common Items', <Settings className="w-5 h-5" />, 'General/Special Items')}

        {/* Filters Tab */}
        {activeTab === 'filters' && renderAssetTable('FILTER', 'Filters', <Filter className="w-5 h-5" />, 'Fuel, Air, Hydraulic Filters')}

        {/* Job Cards Tab */}
        {activeTab === 'jobcards' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><FileText className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-xl font-bold">Job Cards</h2>
                  <p className="text-sm text-gray-500">{jobCards.length} records</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search..." value={jobCardSearch} onChange={(e) => setJobCardSearch(e.target.value)} className="pl-10 w-48" />
                </div>
                <Button onClick={() => { resetJobCardForm(); setActiveTab('create'); }}><Plus className="w-4 h-4 mr-1" />New Job Card</Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Job Card No</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-28 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobCards().map(jc => {
                        const subtotal = jc.totalSparePartsCost + jc.totalManpowerCost + jc.outsideWorkCost;
                        const grandTotal = subtotal * 1.10; // With 10% sundry + workshop
                        return (
                          <TableRow key={jc.id}>
                            <TableCell className="font-medium">{jc.jobCardNo}</TableCell>
                            <TableCell>{jc.vehicleRegNo}</TableCell>
                            <TableCell><Badge variant="outline">{jc.items.length} items</Badge></TableCell>
                            <TableCell className="text-right font-medium text-green-600">Rs. {grandTotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select value={jc.status} onValueChange={(v: any) => updateJobCardStatus(jc.id, v)}>
                              <SelectTrigger className="h-8 w-32">
                                <Badge className={statusConfig[jc.status].color}>{statusConfig[jc.status].label}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{new Date(jc.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => viewJobCard(jc)}><Eye className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteJobCard(jc.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Job Card Tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" />Select Vehicle / Machinery</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="Search by registration number..." value={machineSearch} onChange={(e) => setMachineSearch(e.target.value)} className="pl-10" />
                      </div>
                      <ScrollArea className="h-48 mt-2 border rounded-lg">
                        {machines.filter(m => m.registrationNo.toLowerCase().includes(machineSearch.toLowerCase())).slice(0, 20).map(machine => (
                          <div key={machine.id} className={`p-3 cursor-pointer hover:bg-gray-50 border-b flex items-center justify-between ${selectedVehicle === machine.registrationNo ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`} onClick={() => setSelectedVehicle(machine.registrationNo)}>
                            <div><p className="font-medium">{machine.registrationNo}</p><p className="text-sm text-gray-500">{machine.brand} {machine.type}</p></div>
                            {selectedVehicle === machine.registrationNo && <CheckCircle className="w-5 h-5 text-primary" />}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    {selectedMachine && (
                      <div className="w-48 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Vehicle Details</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-gray-500">E&C No:</span> {selectedMachine.ecNo || '-'}</p>
                          <p><span className="text-gray-500">Brand:</span> {selectedMachine.brand}</p>
                          <p><span className="text-gray-500">Type:</span> {selectedMachine.type}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Select Issued Items (Only Pending)</CardTitle></CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="grid grid-cols-5 mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="MRN_ITEM">MRN</TabsTrigger>
                      <TabsTrigger value="LUBRICANT">Lubricants</TabsTrigger>
                      <TabsTrigger value="COMMON_ITEM">Common</TabsTrigger>
                      <TabsTrigger value="FILTER">Filters</TabsTrigger>
                    </TabsList>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input placeholder="Search items..." value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} className="pl-10" />
                    </div>
                    {(['all', 'MRN_ITEM', 'LUBRICANT', 'COMMON_ITEM', 'FILTER'] as const).map(cat => (
                      <TabsContent key={cat} value={cat}>
                        <ScrollArea className="h-64 border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>MRN No</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {materials.filter(m => (cat === 'all' || m.category === cat) && !m.isUsed).filter(m => !materialSearch || m.description.toLowerCase().includes(materialSearch.toLowerCase()) || m.mrnNo.toLowerCase().includes(materialSearch.toLowerCase())).map(material => (
                                <TableRow key={material.id} className={`cursor-pointer ${selectedItems.find(i => i.issuedMaterialId === material.id) ? 'bg-primary/10' : ''}`} onClick={() => handleItemToggle(material)}>
                                  <TableCell><Checkbox checked={!!selectedItems.find(i => i.issuedMaterialId === material.id)} /></TableCell>
                                  <TableCell>{material.mrnNo}</TableCell>
                                  <TableCell className="max-w-xs truncate">{material.description}</TableCell>
                                  <TableCell>{material.qty} {material.unit}</TableCell>
                                  <TableCell><Badge className="bg-amber-100 text-amber-700">Pending</Badge></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {selectedItems.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="w-5 h-5" />Selected Items ({selectedItems.length})</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>MRN No</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-12"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell><Badge className={categoryConfig[item.itemType].color}>{categoryConfig[item.itemType].label}</Badge></TableCell>
                              <TableCell>{item.issuedMaterial.mrnNo}</TableCell>
                              <TableCell>{item.issuedMaterial.description}</TableCell>
                              <TableCell>{item.issuedMaterial.qty} {item.issuedMaterial.unit}</TableCell>
                              <TableCell className="text-right">{item.issuedMaterial.total?.toFixed(2) || '-'}</TableCell>
                              <TableCell><Button size="sm" variant="ghost" onClick={() => handleItemToggle(item.issuedMaterial)}><Trash2 className="w-4 h-4 text-red-500" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Outside Works</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {outsideWorks.map((work, index) => (
                      <div key={index} className="flex gap-4 items-end">
                        <div className="flex-1"><Label>Date</Label><Input type="date" value={work.date.split('T')[0]} onChange={(e) => setOutsideWorks(prev => prev.map((w, i) => i === index ? {...w, date: e.target.value} : w))} /></div>
                        <div className="flex-[2]"><Label>Description</Label><Input value={work.description} onChange={(e) => setOutsideWorks(prev => prev.map((w, i) => i === index ? {...w, description: e.target.value} : w))} /></div>
                        <div className="w-32"><Label>Cost (Rs.)</Label><Input type="number" value={work.cost} onChange={(e) => setOutsideWorks(prev => prev.map((w, i) => i === index ? {...w, cost: parseFloat(e.target.value) || 0} : w))} /></div>
                        <Button variant="outline" size="icon" onClick={() => setOutsideWorks(prev => prev.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setOutsideWorks(prev => [...prev, { date: new Date().toISOString().split('T')[0], description: '', cost: 0 }])}><Plus className="w-4 h-4 mr-2" />Add Outside Work</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Job Card Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Company Code</Label><Input value={formData.companyCode} onChange={(e) => setFormData({...formData, companyCode: e.target.value})} /></div>
                  <div><Label>Meter Reading</Label><Input type="number" value={formData.vehicleMachineryMeter} onChange={(e) => setFormData({...formData, vehicleMachineryMeter: e.target.value})} /></div>
                  <div>
                    <Label>Repair Type</Label>
                    <Select value={formData.repairType} onValueChange={(v) => setFormData({...formData, repairType: v})}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accident">Accident</SelectItem>
                        <SelectItem value="Breakdown">Breakdown</SelectItem>
                        <SelectItem value="Routine">Routine Maintenance</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Expected Completion Date</Label><Input type="date" value={formData.expectedCompletionDate} onChange={(e) => setFormData({...formData, expectedCompletionDate: e.target.value})} /></div>
                  <Separator />
                  <div><Label>Driver/Operator Name</Label><Input value={formData.driverOperatorName} onChange={(e) => setFormData({...formData, driverOperatorName: e.target.value})} /></div>
                  <div><Label>Contact No</Label><Input value={formData.driverOperatorContact} onChange={(e) => setFormData({...formData, driverOperatorContact: e.target.value})} /></div>
                  <div><Label>BCD No</Label><Input value={formData.bcdNo} onChange={(e) => setFormData({...formData, bcdNo: e.target.value})} /></div>
                  <Separator />
                  <div><Label>Job Description</Label><Textarea value={formData.jobDescription} onChange={(e) => setFormData({...formData, jobDescription: e.target.value})} rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Start Date</Label><Input type="date" value={formData.jobStartDate} onChange={(e) => setFormData({...formData, jobStartDate: e.target.value})} /></div>
                    <div><Label>Completed Date</Label><Input type="date" value={formData.jobCompletedDate} onChange={(e) => setFormData({...formData, jobCompletedDate: e.target.value})} /></div>
                  </div>
                  <div><Label>Supervisor Name</Label><Input value={formData.supervisorName} onChange={(e) => setFormData({...formData, supervisorName: e.target.value})} /></div>
                  <div><Label>Manpower Cost (Rs.)</Label><Input type="number" value={formData.totalManpowerCost} onChange={(e) => setFormData({...formData, totalManpowerCost: e.target.value})} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Cost Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-gray-500">Spare Parts</span><span className="font-medium">Rs. {totals.sparePartsCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Manpower</span><span className="font-medium">Rs. {totals.manpowerCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Outside Works</span><span className="font-medium">Rs. {totals.outsideWorkCost.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">Rs. {totals.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Sundry + Workshop (10%)</span><span className="font-medium text-amber-600">Rs. {totals.sundryWorkshopCost.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span className="text-green-600">Rs. {totals.total.toFixed(2)}</span></div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetJobCardForm}>Clear</Button>
                <Button className="flex-1" onClick={saveJobCard}><FileText className="w-4 h-4 mr-2" />Save Job Card</Button>
              </div>
            </div>
          </div>
        )}

        {/* View Job Card */}
        {activeTab === 'view' && selectedJobCard && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedJobCard.jobCardNo}</h2>
                <p className="text-gray-500">{selectedJobCard.vehicleRegNo}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
                <Button variant="outline" onClick={() => setActiveTab('jobcards')}>Back to List</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Vehicle Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Registration No</p><p className="font-medium">{selectedJobCard.vehicleRegNo}</p></div>
                  <div><p className="text-sm text-gray-500">Company Code</p><p className="font-medium">{selectedJobCard.companyCode || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Meter Reading</p><p className="font-medium">{selectedJobCard.vehicleMachineryMeter || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Repair Type</p><p className="font-medium">{selectedJobCard.repairType || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Driver/Operator</p><p className="font-medium">{selectedJobCard.driverOperatorName || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Contact</p><p className="font-medium">{selectedJobCard.driverOperatorContact || '-'}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Job Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Start Date</p><p className="font-medium">{selectedJobCard.jobStartDate ? new Date(selectedJobCard.jobStartDate).toLocaleDateString() : '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Completed Date</p><p className="font-medium">{selectedJobCard.jobCompletedDate ? new Date(selectedJobCard.jobCompletedDate).toLocaleDateString() : '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Supervisor</p><p className="font-medium">{selectedJobCard.supervisorName || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Status</p><Badge className={statusConfig[selectedJobCard.status].color}>{statusConfig[selectedJobCard.status].label}</Badge></div>
                  <div className="col-span-2"><p className="text-sm text-gray-500">Job Description</p><p className="font-medium">{selectedJobCard.jobDescription || '-'}</p></div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Issued Items</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>MRN No</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedJobCard.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell><Badge className={categoryConfig[item.itemType].color}>{categoryConfig[item.itemType].label}</Badge></TableCell>
                        <TableCell>{item.issuedMaterial.mrnNo}</TableCell>
                        <TableCell>{item.issuedMaterial.description}</TableCell>
                        <TableCell>{item.issuedMaterial.unit}</TableCell>
                        <TableCell>{item.issuedMaterial.qty}</TableCell>
                        <TableCell className="text-right">{item.issuedMaterial.total?.toFixed(2) || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Cost Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500">Spare Parts Cost</span><span className="font-medium">Rs. {selectedJobCard.totalSparePartsCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Manpower Cost</span><span className="font-medium">Rs. {selectedJobCard.totalManpowerCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Outside Work Cost</span><span className="font-medium">Rs. {selectedJobCard.outsideWorkCost.toFixed(2)}</span></div>
                  <Separator />
                  {(() => {
                    const subtotal = selectedJobCard.totalSparePartsCost + selectedJobCard.totalManpowerCost + selectedJobCard.outsideWorkCost;
                    const sundryWorkshopCost = subtotal * 0.10;
                    const grandTotal = subtotal + sundryWorkshopCost;
                    return (
                      <>
                        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">Rs. {subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Sundry + Workshop (10%)</span><span className="font-medium text-amber-600">Rs. {sundryWorkshopCost.toFixed(2)}</span></div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Grand Total</span><span className="text-green-600">Rs. {grandTotal.toFixed(2)}</span></div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Auto Generate Dialog */}
      <Dialog open={autoGenerateDialogOpen} onOpenChange={setAutoGenerateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Auto Generate Job Cards
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              This will create job cards for ALL pending materials grouped by vehicle. 
              {Object.keys(groupedMaterials).length} vehicles with {stats.unusedMaterials} materials will be processed.
            </p>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-4 space-y-2">
                {Object.entries(groupedMaterials).map(([vehicle, mats]) => {
                  const subtotal = mats.reduce((s, m) => s + (m.total || 0), 0);
                  const grandTotal = subtotal * 1.10;
                  return (
                    <div key={vehicle} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{vehicle}</p>
                        <p className="text-sm text-gray-500">{mats.length} items</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Rs. {grandTotal.toFixed(2)} <span className="text-xs opacity-70">(incl. 10%)</span></Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAutoGenerateAll} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">
              {isGenerating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Generate All Job Cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>Edward and Christie - Job Card Management System</p>
            <p>Doc. No.: EC40.WS.FO.3:4:22.10</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
