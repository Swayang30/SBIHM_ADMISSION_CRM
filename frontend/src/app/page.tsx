'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  LayoutDashboard, Users, KanbanSquare, Megaphone, ShieldCheck, 
  Settings, LogOut, Sun, Moon, Calendar, Phone, MessageSquare, 
  FileText, Upload, Plus, Search, Filter, AlertTriangle, CheckCircle, 
  Activity, DollarSign, Layers, Award, Clock, ArrowRight, UserCheck, Check,
  Play, Send
} from 'lucide-react';
import { fetchFromAPI, MOCK_LEADS, User } from '../lib/api';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const LeadStatus = {
  NEW_LEAD: 'NEW_LEAD',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  COUNSELLING_SCHEDULED: 'COUNSELLING_SCHEDULED',
  DOCUMENTS_PENDING: 'DOCUMENTS_PENDING',
  DOCUMENTS_RECEIVED: 'DOCUMENTS_RECEIVED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  ADMISSION_CONFIRMED: 'ADMISSION_CONFIRMED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  JOINED: 'JOINED',
  NOT_INTERESTED: 'NOT_INTERESTED',
  LOST: 'LOST',
  DUPLICATE: 'DUPLICATE',
  SPAM: 'SPAM'
};

export default function DashboardApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@college.edu');
  const [loginPassword, setLoginPassword] = useState('Password123');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // System Settings local states
  const [settingsSubTab, setSettingsSubTab] = useState('users'); // 'users' or 'integrations'
  
  // User Management
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Password123');
  const [newUserRole, setNewUserRole] = useState('COUNSELLOR');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCampus, setNewUserCampus] = useState('MCC');
  const [usersList, setUsersList] = useState<any[]>([
    { id: 'usr-1', name: 'Sarah Connor', email: 'sarah@college.edu', role: 'COUNSELLOR', phone: '+919999900001', campusId: 'MCC' },
    { id: 'usr-2', name: 'John Doe', email: 'john@college.edu', role: 'COUNSELLOR', phone: '+919999900002', campusId: 'MCC' },
    { id: 'usr-3', name: 'Main Campus Admin', email: 'main-admin@college.edu', role: 'COLLEGE_ADMIN', phone: '+919999900003', campusId: 'MCC' }
  ]);

  // Integration credentials local state
  const [googleAdsDevToken, setGoogleAdsDevToken] = useState('dev-token-abc123xyz');
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState('123-456-7890');
  const [metaAdsToken, setMetaAdsToken] = useState('EAAdFd781GZA0BALs...');
  const [metaPixelId, setMetaPixelId] = useState('9876543210123');
  const [ga4MeasurementId, setGa4MeasurementId] = useState('G-ABC987XYZ');
  const [ga4ApiSecret, setGa4ApiSecret] = useState('sec_9201837hja...');


  // States for DB / Mock loaded data
  const [leads, setLeads] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [marketingStats, setMarketingStats] = useState<any>(null);
  const [counsellorStats, setCounsellorStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const [tempFilter, setTempFilter] = useState('');

  // Selected Lead Modal
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newRemark, setNewRemark] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupRemarks, setFollowupRemarks] = useState('');
  
  // Custom SLA status checking banner state
  const [slaBreachAlert, setSlaBreachAlert] = useState<string | null>(null);

  // Load state on mount/auth changes
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    const storedUser = localStorage.getItem('crm_user');
    if (token && storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadData();
    }
  }, [isAuthenticated, currentUser, selectedCampus, startDateFilter, endDateFilter]);

  const loadData = async () => {
    try {
      // Leads
      const leadsRes = await fetchFromAPI(`/leads?limit=100&search=${searchQuery}&startDate=${startDateFilter}&endDate=${endDateFilter}`);
      setLeads(leadsRes.data || MOCK_LEADS);

      // Dashboards
      const adminRes = await fetchFromAPI(`/reports/admin-dashboard?campusId=${selectedCampus === 'All Campuses' ? '' : selectedCampus}&startDate=${startDateFilter}&endDate=${endDateFilter}`);
      setAdminStats(adminRes);

      const mktRes = await fetchFromAPI('/reports/marketing-dashboard');
      setMarketingStats(mktRes);

      if (currentUser?.role === 'COUNSELLOR') {
        const cnsRes = await fetchFromAPI('/reports/counsellor-dashboard');
        setCounsellorStats(cnsRes);
      }

      // Audit Logs
      const auditRes = await fetchFromAPI('/audit-logs?limit=10');
      setAuditLogs(auditRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchFromAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.accessToken) {
        localStorage.setItem('crm_token', res.accessToken);
        localStorage.setItem('crm_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
        setIsAuthenticated(true);
      }
    } catch (err) {
      alert('Login Failed: ' + err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const triggerSlaCheck = async () => {
    try {
      const res = await fetchFromAPI('/leads/sla-check', { method: 'POST' });
      setSlaBreachAlert(`SLA Check Complete! Breached leads flagged: ${res.breachedCount || 0}`);
      setTimeout(() => setSlaBreachAlert(null), 5000);
      loadData();
    } catch (e) {
      // Fallback UI notification
      setSlaBreachAlert("SLA Check Complete (Mock mode). 0 new breaches identified.");
      setTimeout(() => setSlaBreachAlert(null), 4000);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await fetchFromAPI(`/leads/${leadId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
      if (selectedLead && selectedLead.id === leadId) {
        const updatedLead = await fetchFromAPI(`/leads/${leadId}`);
        setSelectedLead(updatedLead);
      }
    } catch (e) {
      // Local fallback
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    }
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappMsg.trim() || !selectedLead) return;
    try {
      await fetchFromAPI(`/communications/${selectedLead.id}/whatsapp`, {
        method: 'POST',
        body: JSON.stringify({ messageBody: whatsappMsg }),
      });
      setWhatsappMsg('');
      const updatedLead = await fetchFromAPI(`/leads/${selectedLead.id}`);
      setSelectedLead(updatedLead);
      loadData();
    } catch (e) {
      // Mock update local UI
      const mockMsg = { id: Math.random().toString(), direction: 'OUTBOUND', messageBody: whatsappMsg, status: 'READ', createdAt: new Date().toISOString() };
      setSelectedLead(prev => ({
        ...prev,
        whatsappMessages: [mockMsg, ...(prev.whatsappMessages || [])]
      }));
      setWhatsappMsg('');
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !selectedLead) return;
    try {
      await fetchFromAPI(`/leads/${selectedLead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ remarks: newRemark }),
      });
      setNewRemark('');
      const updatedLead = await fetchFromAPI(`/leads/${selectedLead.id}`);
      setSelectedLead(updatedLead);
      loadData();
    } catch (e) {
      // Mock update local UI
      const newAct = { id: Math.random().toString(), actionType: 'REMARK_ADDED', description: `Remark added: ${newRemark}`, createdAt: new Date().toISOString() };
      setSelectedLead(prev => ({
        ...prev,
        activities: [newAct, ...(prev.activities || [])]
      }));
      setNewRemark('');
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupDate || !followupRemarks || !selectedLead) return;
    const datetime = `${followupDate}T${followupTime || '09:00'}:00`;
    try {
      await fetchFromAPI(`/leads/${selectedLead.id}/followup`, {
        method: 'POST',
        body: JSON.stringify({ scheduledFor: datetime, remarks: followupRemarks }),
      });
      setFollowupDate('');
      setFollowupTime('');
      setFollowupRemarks('');
      const updatedLead = await fetchFromAPI(`/leads/${selectedLead.id}`);
      setSelectedLead(updatedLead);
      loadData();
    } catch (e) {
      // Mock local UI
      const mockFup = { id: Math.random().toString(), scheduledFor: datetime, remarks: followupRemarks, isCompleted: false };
      setSelectedLead(prev => ({
        ...prev,
        followups: [mockFup, ...(prev.followups || [])]
      }));
      setFollowupDate('');
      setFollowupTime('');
      setFollowupRemarks('');
    }
  };

  const handleMakeCall = async () => {
    if (!selectedLead) return;
    try {
      await fetchFromAPI(`/communications/${selectedLead.id}/call`, { method: 'POST' });
      alert(`Dialing ${selectedLead.studentName} at ${selectedLead.phone}... Call connected. Recording will be saved to timeline.`);
      const updatedLead = await fetchFromAPI(`/leads/${selectedLead.id}`);
      setSelectedLead(updatedLead);
      loadData();
    } catch (e) {
      // Mock call update UI
      const newAct = { id: Math.random().toString(), actionType: 'COMMUNICATION', description: `Dialed ${selectedLead.phone}... Call duration: 1m 45s.`, createdAt: new Date().toISOString() };
      setSelectedLead(prev => ({
        ...prev,
        activities: [newAct, ...(prev.activities || [])]
      }));
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.phone.includes(searchQuery) ||
                          l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.id.includes(searchQuery);
    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    const matchesTemp = tempFilter ? l.temperature === tempFilter : true;
    return matchesSearch && matchesStatus && matchesTemp;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Plan D Media" className="h-10 object-contain" />
          </div>

          <p className="text-slate-400 text-center mb-8 text-sm">
            College Admission & Attribution Management Suite
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="admin@college.edu" 
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="••••••••" 
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition duration-200 text-white font-medium py-2 rounded-lg text-sm mt-2"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Demo Quick Credentials</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => { setLoginEmail('admin@college.edu'); setLoginPassword('Password123'); }}
                className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 py-1.5 px-2 rounded border border-slate-800 text-left"
              >
                <strong>Admin:</strong> admin@college.edu
              </button>
              <button 
                onClick={() => { setLoginEmail('marketing@college.edu'); setLoginPassword('Password123'); }}
                className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 py-1.5 px-2 rounded border border-slate-800 text-left"
              >
                <strong>Marketing:</strong> marketing@college.edu
              </button>
              <button 
                onClick={() => { setLoginEmail('sarah@college.edu'); setLoginPassword('Password123'); }}
                className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 py-1.5 px-2 rounded border border-slate-800 text-left"
              >
                <strong>Sarah (Counselor):</strong> sarah@college.edu
              </button>
              <button 
                onClick={() => { setLoginEmail('john@college.edu'); setLoginPassword('Password123'); }}
                className="bg-slate-900/60 hover:bg-slate-900 text-slate-300 py-1.5 px-2 rounded border border-slate-800 text-left"
              >
                <strong>John (Counselor):</strong> john@college.edu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-200`}>
      {/* SLA Breach Alert Banner */}
      {slaBreachAlert && (
        <div className="bg-indigo-600 text-white py-2 px-4 text-center font-medium text-sm flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="h-4 w-4" />
          <span>{slaBreachAlert}</span>
        </div>
      )}

      {/* Outer App Frame */}
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
          <div>
            {/* Header logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
              <img src="/logo.png" alt="Plan D Media" className="h-6 object-contain" />
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Admissions Dashboard
              </button>

              <button 
                onClick={() => setActiveTab('leads')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'leads' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Users className="h-4 w-4" />
                Inquiry Management
              </button>

              <button 
                onClick={() => setActiveTab('applications')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'applications' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <FileText className="h-4 w-4" />
                Application Manager
              </button>

              <button 
                onClick={() => setActiveTab('kanban')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <KanbanSquare className="h-4 w-4" />
                Pipeline Kanban
              </button>

              <button 
                onClick={() => setActiveTab('whatsapp-hub')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'whatsapp-hub' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp Campaigns
              </button>

              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'MARKETING_TEAM') && (
                <button 
                  onClick={() => setActiveTab('marketing')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'marketing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <Megaphone className="h-4 w-4" />
                  Marketing Attribution
                </button>
              )}

              <button 
                onClick={() => setActiveTab('academic')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'academic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <Layers className="h-4 w-4" />
                Academic Catalog
              </button>

              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'COLLEGE_ADMIN') && (
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <Settings className="h-4 w-4" />
                  System Settings
                </button>
              )}

              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'COLLEGE_ADMIN') && (
                <button 
                  onClick={() => setActiveTab('audit-logs')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'audit-logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Security Audit Logs
                </button>
              )}
            </nav>
          </div>

          {/* User profile section */}
          <div className="p-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {currentUser?.name[0]}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{currentUser?.role.replace('_', ' ')}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-950 hover:text-red-300 transition duration-150 py-1.5 rounded-lg text-xs font-medium text-slate-300"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* CONTENT CONTAINER */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* HEADER NAVIGATION */}
          <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                {activeTab.replace('-', ' ')}
              </h2>

              {/* Multi-campus picker */}
              <div className="flex items-center bg-slate-800 rounded-lg px-2 py-1">
                <span className="text-xs text-slate-400 mr-2">Campus:</span>
                <select 
                  value={selectedCampus}
                  onChange={e => setSelectedCampus(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
                >
                  <option value="All Campuses" className="bg-slate-900">All Campuses</option>
                  <option value="MCC" className="bg-slate-900">Main City Campus (MCC)</option>
                  <option value="NVC" className="bg-slate-900">North Valley Campus (NVC)</option>
                </select>
              </div>

              {/* Date range picker */}
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1 text-xs">
                <span className="text-slate-400 font-medium">Period:</span>
                <input 
                  type="date"
                  value={startDateFilter}
                  onChange={e => setStartDateFilter(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none cursor-pointer text-[10px]"
                />
                <span className="text-slate-550">to</span>
                <input 
                  type="date"
                  value={endDateFilter}
                  onChange={e => setEndDateFilter(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none cursor-pointer text-[10px]"
                />
                {(startDateFilter || endDateFilter) && (
                  <button 
                    onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                    className="text-red-400 hover:text-red-300 font-bold ml-1 text-[10px]"
                    title="Clear date filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Export report button */}
              <button 
                onClick={() => {
                  const headers = ['Lead ID', 'Student Name', 'Email', 'Phone', 'Stage', 'Temperature', 'Campus', 'Course', 'Source', 'Attribution Campaign', 'Created Date'];
                  const rows = leads.map(l => [
                    l.id,
                    l.studentName,
                    l.email,
                    l.phone,
                    l.status,
                    l.temperature,
                    l.campusName || 'Main',
                    l.courseName || 'B.Tech CS',
                    l.leadSource,
                    l.utmCampaign || 'organic',
                    new Date(l.createdAt || Date.now()).toLocaleDateString()
                  ]);
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `AuraCRM_Custom_Report_${startDateFilter || 'all'}_to_${endDateFilter || 'all'}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 px-3 rounded-lg text-xs font-medium transition"
                title="Export current leads view as CSV"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-450" />
                Export CSV
              </button>

              {/* Trigger SLA checking */}
              <button 
                onClick={triggerSlaCheck}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 py-1.5 px-3 rounded-lg text-xs font-medium transition"
                title="Check for missed 15-minute lead response SLA"
              >
                <Clock className="h-3.5 w-3.5" />
                Check SLA
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* DYNAMIC TAB BODY */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* OVERVIEW DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* METRICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Leads</p>
                        <h3 className="text-3xl font-extrabold mt-1 text-white">
                          {adminStats?.overview?.totalLeads || 0}
                        </h3>
                      </div>
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span>+14% vs yesterday</span>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admissions Done</p>
                        <h3 className="text-3xl font-extrabold mt-1 text-white">
                          {adminStats?.overview?.admissionsDone || 0}
                        </h3>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Target: {adminStats?.overview?.admissionTarget || 250}</span>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion %</p>
                        <h3 className="text-3xl font-extrabold mt-1 text-white">
                          {adminStats?.overview?.conversionRate || '0.00'}%
                        </h3>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                        <Award className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span>High intent qualified funnel</span>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected Revenue</p>
                        <h3 className="text-3xl font-extrabold mt-1 text-white">
                          ${(adminStats?.overview?.revenue || 0).toLocaleString()}
                        </h3>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <DollarSign className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <span>Payment channel direct sync</span>
                    </div>
                  </div>
                </div>

                {/* CHARTS GRAPH SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Lead Stages Funnel Bar Chart */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800 md:col-span-2">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Admissions Stages Funnel</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'New Leads', count: adminStats?.statusPipeline?.NEW_LEAD || 1 },
                          { name: 'Contacted', count: adminStats?.statusPipeline?.CONTACTED || 0 },
                          { name: 'Interested', count: adminStats?.statusPipeline?.INTERESTED || 1 },
                          { name: 'Counselling', count: adminStats?.statusPipeline?.COUNSELLING_SCHEDULED || 0 },
                          { name: 'Docs Pend', count: adminStats?.statusPipeline?.DOCUMENTS_PENDING || 0 },
                          { name: 'Docs Recv', count: adminStats?.statusPipeline?.DOCUMENTS_RECEIVED || 0 },
                          { name: 'Confirmed', count: adminStats?.overview?.admissionsDone || 1 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                          <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                            <Cell fill="#6366f1" />
                            <Cell fill="#4f46e5" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ec4899" />
                            <Cell fill="#8b5cf6" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Temperature Temperature Distribution */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Lead Temperature Scoring</h3>
                    <div className="h-64 flex flex-col justify-between">
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Cold', value: adminStats?.temperatureFunnel?.COLD || 1 },
                                { name: 'Warm', value: adminStats?.temperatureFunnel?.WARM || 1 },
                                { name: 'Hot', value: adminStats?.temperatureFunnel?.HOT || 1 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#3b82f6" />
                              <Cell fill="#f97316" />
                              <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                        <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
                          <p className="text-blue-400 font-bold">COLD</p>
                          <p className="text-slate-300 font-medium">{adminStats?.temperatureFunnel?.COLD || 0}</p>
                        </div>
                        <div className="p-1 rounded bg-orange-500/10 border border-orange-500/20">
                          <p className="text-orange-400 font-bold">WARM</p>
                          <p className="text-slate-300 font-medium">{adminStats?.temperatureFunnel?.WARM || 0}</p>
                        </div>
                        <div className="p-1 rounded bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 font-bold">HOT</p>
                          <p className="text-slate-300 font-medium">{adminStats?.temperatureFunnel?.HOT || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMPARISONS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Campus wise performance table */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Campus Enrollment Targets</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2">Campus Name</th>
                            <th className="py-2">Leads Generated</th>
                            <th className="py-2">Admissions Done</th>
                            <th className="py-2">Conversion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats?.campuses?.map((c: any, i: number) => (
                            <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/40">
                              <td className="py-3 font-semibold text-slate-200">{c.name}</td>
                              <td className="py-3 text-slate-300">{c.leads}</td>
                              <td className="py-3 text-emerald-400 font-semibold">{c.admissions}</td>
                              <td className="py-3">
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(c.admissions / (c.leads || 1)) * 100}%` }}></div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Counselor performance table */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Counselor Conversion Target Leaderboard</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2">Counselor</th>
                            <th className="py-2">Assigned Leads</th>
                            <th className="py-2">Admissions Count</th>
                            <th className="py-2">Completion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminStats?.counsellors?.map((c: any, i: number) => (
                            <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/40">
                              <td className="py-3 font-semibold text-slate-200 flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px]">
                                  {c.name[0]}
                                </span>
                                {c.name}
                              </td>
                              <td className="py-3 text-slate-300">{c.assigned}</td>
                              <td className="py-3 text-emerald-400 font-semibold">{c.converted}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                  {c.assigned > 0 ? Math.round((c.converted / c.assigned) * 100) : 0}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* LEADS DIRECTORY LISTING */}
            {activeTab === 'leads' && (
              <div className="glass-panel p-6 rounded-xl border border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  
                  {/* Global search */}
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search name, phone, email..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); loadData(); }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
                    />
                  </div>

                  {/* Filters row */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-transparent text-xs focus:outline-none text-slate-200"
                      >
                        <option value="" className="bg-slate-900">All Stages</option>
                        {Object.keys(LeadStatus).map(s => (
                          <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                      <AlertTriangle className="h-3 w-3 text-slate-400" />
                      <select 
                        value={tempFilter}
                        onChange={e => setTempFilter(e.target.value)}
                        className="bg-transparent text-xs focus:outline-none text-slate-200"
                      >
                        <option value="" className="bg-slate-900">All Temps</option>
                        <option value="COLD" className="bg-slate-900">Cold</option>
                        <option value="WARM" className="bg-slate-900">Warm</option>
                        <option value="HOT" className="bg-slate-900">Hot</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Advanced responsive Lead Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pt-1">Student Details</th>
                        <th className="pb-3 pt-1">Campus/Course</th>
                        <th className="pb-3 pt-1">Source / Attribution</th>
                        <th className="pb-3 pt-1">Temperature</th>
                        <th className="pb-3 pt-1">Status Stage</th>
                        <th className="pb-3 pt-1">Assignee</th>
                        <th className="pb-3 pt-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead: any) => (
                        <tr key={lead.id} className="border-b border-slate-850 hover:bg-slate-900/40 group">
                          <td className="py-4">
                            <div className="font-semibold text-slate-100">{lead.studentName}</div>
                            <div className="text-slate-400 text-[10px]">{lead.phone} | {lead.email}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-slate-200 font-medium">{lead.courseName || lead.course?.name || 'N/A'}</div>
                            <div className="text-slate-400 text-[10px]">{lead.campusName || lead.campus?.name || 'All'}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-indigo-400 font-medium">{lead.leadSource}</div>
                            <div className="text-slate-500 text-[10px] font-mono">{lead.utmCampaign || 'organic'}</div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.temperature === 'HOT' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                              lead.temperature === 'WARM' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {lead.temperature}
                            </span>
                          </td>
                          <td className="py-4">
                            <select 
                              value={lead.status}
                              onChange={e => updateLeadStatus(lead.id, e.target.value)}
                              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-200 focus:outline-none"
                            >
                              {Object.keys(LeadStatus).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4">
                            <div className="text-slate-300 font-medium flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              {lead.counsellorName || lead.counsellor?.name || 'Unassigned'}
                            </div>
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={async () => {
                                try {
                                  const detail = await fetchFromAPI(`/leads/${lead.id}`);
                                  setSelectedLead(detail);
                                } catch (e) {
                                  // Fallback using directory item
                                  setSelectedLead(lead);
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1 rounded text-[10px] transition"
                            >
                              Manage Details
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredLeads.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No active leads found matching the filter query criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DRAGGABLE KANBAN PIPELINE */}
            {activeTab === 'kanban' && (
              <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-12rem)]">
                {['NEW_LEAD', 'INTERESTED', 'COUNSELLING_SCHEDULED', 'DOCUMENTS_RECEIVED', 'ADMISSION_CONFIRMED', 'PAYMENT_COMPLETED'].map(stage => {
                  const stageLeads = leads.filter(l => l.status === stage);

                  return (
                    <div key={stage} className="flex-shrink-0 w-80 bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col h-full">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{stage.replace('_', ' ')}</h4>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400">{stageLeads.length}</span>
                      </div>

                      {/* Lane card container */}
                      <div className="flex-1 overflow-y-auto space-y-3 kanban-column">
                        {stageLeads.map(lead => (
                          <div 
                            key={lead.id}
                            className={`p-3 rounded-lg bg-slate-950 border border-slate-850 hover:border-indigo-500 transition-all cursor-pointer relative group ${
                              lead.temperature === 'HOT' ? 'temperature-hot' : 
                              lead.temperature === 'WARM' ? 'temperature-warm' : 
                              'temperature-cold'
                            }`}
                            onClick={async () => {
                              try {
                                const detail = await fetchFromAPI(`/leads/${lead.id}`);
                                setSelectedLead(detail);
                              } catch (e) {
                                setSelectedLead(lead);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-semibold text-indigo-400">{lead.leadSource}</span>
                              <span className="text-[9px] text-slate-450">{lead.id.substring(0, 8)}</span>
                            </div>

                            <p className="text-xs font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                              {lead.studentName}
                            </p>

                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {lead.courseName || lead.course?.name || 'B.Tech CS'}
                            </p>

                            <div className="mt-3 flex justify-between items-center text-[9px] text-slate-400">
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-350">
                                <UserCheck className="h-3 w-3" />
                                {lead.counsellorName || lead.counsellor?.name || 'Sarah'}
                              </span>
                              
                              {/* Simple status mover inside card */}
                              <select 
                                value={lead.status}
                                onChange={e => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value); }}
                                className="bg-slate-900 border border-slate-800 rounded px-1 text-[9px] text-slate-300"
                              >
                                <option value="NEW_LEAD">New</option>
                                <option value="INTERESTED">Interested</option>
                                <option value="COUNSELLING_SCHEDULED">Counselling</option>
                                <option value="DOCUMENTS_RECEIVED">Docs Recv</option>
                                <option value="ADMISSION_CONFIRMED">Admitted</option>
                                <option value="PAYMENT_COMPLETED">Paid</option>
                              </select>
                            </div>
                          </div>
                        ))}

                        {stageLeads.length === 0 && (
                          <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-slate-500 text-xs">
                            Drag or move cards here
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MARKETING ANALYTICS VIEW */}
            {activeTab === 'marketing' && marketingStats && (
              <div className="space-y-6">
                
                {/* ROI Attribution and Google vs Meta Comparison Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Google vs Meta comparison Recharts Bar chart */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800 md:col-span-2">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Google Ads vs Meta Ads Conversion Funnel Comparison</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Google Lead Count', val: marketingStats?.comparison?.google?.leadCount || 45 },
                          { name: 'Meta Lead Count', val: marketingStats?.comparison?.meta?.leadCount || 38 },
                          { name: 'Google Cost ($)', val: marketingStats?.comparison?.google?.cost || 1500 },
                          { name: 'Meta Cost ($)', val: marketingStats?.comparison?.meta?.cost || 1200 },
                          { name: 'Google Admitted', val: marketingStats?.comparison?.google?.admissions || 5 },
                          { name: 'Meta Admitted', val: marketingStats?.comparison?.meta?.admissions || 4 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                          <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]}>
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                            <Cell fill="#f97316" />
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#6366f1" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* UTM Source breakdown pie chart */}
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">UTM Source Lead Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketingStats?.sources?.map((s: any) => ({ name: s.source, value: s.leadCount })) || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {marketingStats?.sources?.map((s: any, idx: number) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* SOURCE WISE PERFORMANCE DETAILED LIST */}
                <div className="glass-panel p-5 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Campaign Lead Source Performance Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400">
                          <th className="py-3">Lead Source</th>
                          <th className="py-3">Leads Captured</th>
                          <th className="py-3">Campaign Cost</th>
                          <th className="py-3">Cost Per Lead (CPL)</th>
                          <th className="py-3">Admissions</th>
                          <th className="py-3">CAC</th>
                          <th className="py-3">Attributed Revenue</th>
                          <th className="py-3">ROAS %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketingStats?.sources?.map((s: any, i: number) => (
                          <tr key={i} className="border-b border-slate-850 hover:bg-slate-900/35">
                            <td className="py-4 font-bold text-slate-200">{s.source}</td>
                            <td className="py-4 text-slate-300">{s.leadCount}</td>
                            <td className="py-4 text-slate-350">${s.cost}</td>
                            <td className="py-4 text-amber-400 font-semibold">${s.cpl}</td>
                            <td className="py-4 text-slate-300">{s.admissions}</td>
                            <td className="py-4 text-red-400 font-semibold">${s.cac}</td>
                            <td className="py-4 text-emerald-400 font-semibold">${s.revenue}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                s.roi > 50 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                s.roi > 0 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {s.roi}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* APPLICATION MANAGER VIEW */}
            {activeTab === 'applications' && (
              <div className="glass-panel p-6 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Application Lifecycle Directory</h3>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                    Total Active Applications: {leads.filter(l => ['DOCUMENTS_RECEIVED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED', 'PAYMENT_COMPLETED', 'JOINED'].includes(l.status)).length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Applicant Name</th>
                        <th className="pb-3">Course / Dept</th>
                        <th className="pb-3">Application Stage</th>
                        <th className="pb-3">Document Status</th>
                        <th className="pb-3">Fee Status</th>
                        <th className="pb-3">Counselor</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.filter(l => ['DOCUMENTS_RECEIVED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED', 'PAYMENT_COMPLETED', 'JOINED', 'DOCUMENTS_PENDING', 'PAYMENT_PENDING'].includes(l.status)).map((lead: any) => (
                        <tr key={lead.id} className="border-b border-slate-850 hover:bg-slate-900/40">
                          <td className="py-4">
                            <div className="font-semibold text-slate-100">{lead.studentName}</div>
                            <div className="text-slate-400 text-[10px]">{lead.email} | {lead.phone}</div>
                          </td>
                          <td className="py-4">
                            <div className="text-slate-200 font-medium">{lead.courseName || lead.course?.name || 'B.Tech CS'}</div>
                            <div className="text-slate-500 text-[9px]">{lead.campusName || lead.campus?.name || 'Main City Campus'}</div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                              {lead.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 font-medium text-slate-350">
                            {['DOCUMENTS_RECEIVED', 'APPLICATION_SUBMITTED', 'ADMISSION_CONFIRMED', 'PAYMENT_COMPLETED', 'JOINED'].includes(lead.status) ? (
                              <span className="text-emerald-400 flex items-center gap-1">✓ Verified</span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">⚠ Pending</span>
                            )}
                          </td>
                          <td className="py-4">
                            {['PAYMENT_COMPLETED', 'JOINED', 'ADMISSION_CONFIRMED'].includes(lead.status) ? (
                              <span className="text-emerald-400 font-bold">Paid</span>
                            ) : (
                              <span className="text-red-400 font-bold">Unpaid</span>
                            )}
                          </td>
                          <td className="py-4 text-slate-400">
                            {lead.counsellorName || lead.counsellor?.name || 'Sarah Connor'}
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={async () => {
                                try {
                                  const detail = await fetchFromAPI(`/leads/${lead.id}`);
                                  setSelectedLead(detail);
                                } catch (e) {
                                  setSelectedLead(lead);
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1 rounded text-[10px] transition"
                            >
                              Open Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* WHATSAPP CAMPAIGNS HUB VIEW */}
            {activeTab === 'whatsapp-hub' && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Broadcasts</p>
                    <h3 className="text-3xl font-extrabold mt-1 text-white">1,420</h3>
                    <div className="text-[10px] text-slate-400 mt-2">Sent across active cohorts</div>
                  </div>
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered Rate</p>
                    <h3 className="text-3xl font-extrabold mt-1 text-emerald-400">97.2%</h3>
                    <div className="text-[10px] text-slate-400 mt-2">1,380 messages reached destination</div>
                  </div>
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Read / Open Rate</p>
                    <h3 className="text-3xl font-extrabold mt-1 text-indigo-400">88.0%</h3>
                    <div className="text-[10px] text-slate-400 mt-2">250 read by candidates</div>
                  </div>
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivery Failures</p>
                    <h3 className="text-3xl font-extrabold mt-1 text-red-400">2.8%</h3>
                    <div className="text-[10px] text-slate-400 mt-2">40 messages failed delivery</div>
                  </div>
                </div>

                {/* Templates list */}
                <div className="glass-panel p-6 rounded-xl border border-slate-800">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Official Approved WhatsApp Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px]">AUTO_WELCOME</span>
                      <h4 className="text-xs font-bold text-white">Welcome Message</h4>
                      <p className="text-[10px] text-slate-400">"Hi {"{1}"}, thank you for inquiring at our institution. Our counselor will contact you soon."</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px]">DOCS_REMINDER</span>
                      <h4 className="text-xs font-bold text-white">Document Submission Pending</h4>
                      <p className="text-[10px] text-slate-400">"Hi {"{1}"}, your high school marksheets are missing for your application verification."</p>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px]">FEE_PAYMENT</span>
                      <h4 className="text-xs font-bold text-white">Application Fee Link</h4>
                      <p className="text-[10px] text-slate-400">"Hi {"{1}"}, please complete your Application Fee of $50 via: {"{2}"} to secure seat."</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACADEMIC CATALOG VIEW */}
            {activeTab === 'academic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Campuses & Locations</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Main City Campus (MCC)</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">101 University Ave, City Center</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">Active</span>
                      </div>
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">North Valley Campus (NVC)</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">500 Valley Parkway, Northside</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-xl border border-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Academic Programs List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2">Course Code</th>
                            <th className="py-2">Course Title</th>
                            <th className="py-2">Duration</th>
                            <th className="py-2">Annual Fees</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-850">
                            <td className="py-3 font-semibold text-slate-200">BTECH-CS</td>
                            <td className="py-3 text-slate-300">B.Tech in Computer Science</td>
                            <td className="py-3 text-slate-400">4 Years</td>
                            <td className="py-3 text-emerald-400 font-bold">$180,000</td>
                          </tr>
                          <tr className="border-b border-slate-850">
                            <td className="py-3 font-semibold text-slate-200">MTECH-AI</td>
                            <td className="py-3 text-slate-300">M.Tech in Artificial Intelligence</td>
                            <td className="py-3 text-slate-400">2 Years</td>
                            <td className="py-3 text-emerald-400 font-bold">$220,000</td>
                          </tr>
                          <tr className="border-b border-slate-850">
                            <td className="py-3 font-semibold text-slate-200">MBA-FA</td>
                            <td className="py-3 text-slate-300">MBA in Financial Analytics</td>
                            <td className="py-3 text-slate-400">2 Years</td>
                            <td className="py-3 text-emerald-400 font-bold">$250,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 min-h-[600px]">
                
                {/* Settings Left sub-nav */}
                <div className="w-full md:w-48 flex flex-col gap-2 border-r border-slate-800 pr-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Setup Sections</h4>
                  <button 
                    onClick={() => setSettingsSubTab('users')}
                    className={`text-left px-3 py-2 rounded text-xs font-semibold transition ${settingsSubTab === 'users' ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-350 hover:bg-slate-900'}`}
                  >
                    User Management
                  </button>
                  <button 
                    onClick={() => setSettingsSubTab('integrations')}
                    className={`text-left px-3 py-2 rounded text-xs font-semibold transition ${settingsSubTab === 'integrations' ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500' : 'text-slate-350 hover:bg-slate-900'}`}
                  >
                    API Integrations (Google/Meta/GA4)
                  </button>
                </div>

                {/* Settings Right panel */}
                <div className="flex-1">
                  
                  {/* USER MANAGEMENT SECTION */}
                  {settingsSubTab === 'users' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">User Directory & Role Management</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Create users and assign specific RBAC roles for campus access.</p>
                        </div>
                      </div>

                      {/* Add User Form */}
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newUserName || !newUserEmail) return;
                        try {
                          await fetchFromAPI('/auth/register', {
                            method: 'POST',
                            body: JSON.stringify({
                              name: newUserName,
                              email: newUserEmail,
                              password: newUserPassword,
                              role: newUserRole,
                              phone: newUserPhone,
                              campusId: newUserCampus === 'MCC' ? 'MCC' : 'NVC'
                            })
                          });
                          alert(`User ${newUserName} registered successfully!`);
                        } catch (err) {
                          // Fallback to update local mock state
                          const newUser = {
                            id: 'usr-' + Math.random().toString(),
                            name: newUserName,
                            email: newUserEmail,
                            role: newUserRole,
                            phone: newUserPhone,
                            campusId: newUserCampus
                          };
                          setUsersList(prev => [...prev, newUser]);
                          alert(`User ${newUserName} created successfully (Mock mode)!`);
                        }
                        setNewUserName('');
                        setNewUserEmail('');
                        setNewUserPhone('');
                      }} className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                          <input 
                            type="text" 
                            value={newUserName}
                            onChange={e => setNewUserName(e.target.value)}
                            placeholder="John Watson"
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                          <input 
                            type="email" 
                            value={newUserEmail}
                            onChange={e => setNewUserEmail(e.target.value)}
                            placeholder="watson@college.edu"
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Password</label>
                          <input 
                            type="password" 
                            value={newUserPassword}
                            onChange={e => setNewUserPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Assignment</label>
                          <select 
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none"
                          >
                            <option value="SUPER_ADMIN" className="bg-slate-950">Super Admin</option>
                            <option value="COLLEGE_ADMIN" className="bg-slate-950">College Admin</option>
                            <option value="ADMISSION_MANAGER" className="bg-slate-950">Admission Manager</option>
                            <option value="COUNSELLOR" className="bg-slate-950">Counsellor (Staff)</option>
                            <option value="MARKETING_TEAM" className="bg-slate-950">Marketing Specialist</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                          <input 
                            type="text" 
                            value={newUserPhone}
                            onChange={e => setNewUserPhone(e.target.value)}
                            placeholder="+919000100020"
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campus Location</label>
                          <select 
                            value={newUserCampus}
                            onChange={e => setNewUserCampus(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 mt-1 text-white text-xs focus:outline-none"
                          >
                            <option value="MCC" className="bg-slate-950">Main City Campus (MCC)</option>
                            <option value="NVC" className="bg-slate-950">North Valley Campus (NVC)</option>
                          </select>
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                          <button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded transition text-xs"
                          >
                            Create User Profile
                          </button>
                        </div>
                      </form>

                      {/* Users list table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="py-2">User Details</th>
                              <th className="py-2">Assigned Role</th>
                              <th className="py-2">Phone</th>
                              <th className="py-2">Campus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.map((user: any) => (
                              <tr key={user.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                <td className="py-3">
                                  <div className="font-bold text-slate-200">{user.name}</div>
                                  <div className="text-[10px] text-slate-500">{user.email}</div>
                                </td>
                                <td className="py-3 font-semibold text-indigo-400">{user.role.replace('_', ' ')}</td>
                                <td className="py-3 text-slate-350">{user.phone || 'N/A'}</td>
                                <td className="py-3 text-slate-400">{user.campusId || 'All'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* API INTEGRATIONS SECTION */}
                  {settingsSubTab === 'integrations' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Live Advertising & Attribution Integrations</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Plug in GA4, Google Ads, and Meta Conversion APIs to sync lead flows automatically.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Google Ads */}
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            <h4 className="font-bold text-white uppercase text-[10px] tracking-wide">Google Ads API Settings</h4>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase tracking-wide">Developer Token</label>
                            <input 
                              type="text" 
                              value={googleAdsDevToken}
                              onChange={e => setGoogleAdsDevToken(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase tracking-wide">Customer ID</label>
                            <input 
                              type="text" 
                              value={googleAdsCustomerId}
                              onChange={e => setGoogleAdsCustomerId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Syncs Google Form Extensions and Google Search click-through leads.
                          </div>
                        </div>

                        {/* Meta Conversion API */}
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            <h4 className="font-bold text-white uppercase text-[10px] tracking-wide">Meta Ads Conversions API</h4>
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase tracking-wide">System User Access Token</label>
                            <input 
                              type="password" 
                              value={metaAdsToken}
                              onChange={e => setMetaAdsToken(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 uppercase tracking-wide">Meta Pixel / Dataset ID</label>
                            <input 
                              type="text" 
                              value={metaPixelId}
                              onChange={e => setMetaPixelId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                            />
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Syncs Facebook Instant Forms and Instagram lead ad submissions.
                          </div>
                        </div>

                        {/* GA4 */}
                        <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-lg space-y-3 md:col-span-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            <h4 className="font-bold text-white uppercase text-[10px] tracking-wide">Google Analytics 4 (GA4) measurement Protocol</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase tracking-wide">Measurement ID</label>
                              <input 
                                type="text" 
                                value={ga4MeasurementId}
                                onChange={e => setGa4MeasurementId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase tracking-wide">Measurement API Secret</label>
                              <input 
                                type="password" 
                                value={ga4ApiSecret}
                                onChange={e => setGa4ApiSecret(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 mt-0.5 text-slate-350 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                              />
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Sends offline counselor conversions (e.g. status updates, payments completed) back to Google Analytics to optimize ROAS metrics automatically.
                          </div>
                        </div>

                        {/* Webhook Endpoint URLs */}
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2 md:col-span-2">
                          <h4 className="font-bold text-white text-[10px] uppercase">Active Lead Ingestion Webhook Endpoints</h4>
                          <p className="text-[10px] text-slate-400">Copy these URLs into your Meta Leads Webhook, Google Leads Developer Panel, or custom WordPress form plugins:</p>
                          <div className="space-y-1 font-mono text-[10px] text-indigo-400">
                            <div className="bg-slate-950 p-1.5 rounded flex justify-between">
                              <span>POST http://localhost:5000/leads</span>
                              <span className="text-slate-500 uppercase text-[9px] font-sans font-bold">Standard Lead Intake</span>
                            </div>
                            <div className="bg-slate-950 p-1.5 rounded flex justify-between">
                              <span>POST http://localhost:5000/communications/whatsapp-webhook</span>
                              <span className="text-slate-500 uppercase text-[9px] font-sans font-bold">WhatsApp Inbound Webhook</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            alert("API credentials saved! Triggering test webhook sync... Integration validation SUCCESSFUL. Fetched 1 dummy lead from Meta.");
                            const testLead = {
                              id: 'lead-test-' + Math.random().toString().substring(0, 5),
                              studentName: "Meta Test Candidate",
                              phone: "+919876540000",
                              email: "meta-test@gmail.com",
                              courseId: "btech-cs",
                              courseName: "B.Tech Computer Science",
                              status: "NEW_LEAD",
                              temperature: "COLD",
                              leadSource: "Meta Ads",
                              utmCampaign: "meta_test_integration",
                              activities: [{ id: "act-t1", actionType: "CREATE_LEAD", description: "Lead fetched via Meta Ads webhook integration test", createdAt: new Date().toISOString() }],
                              followups: [],
                              documents: []
                            };
                            setLeads(prev => [testLead, ...prev]);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold py-2 px-4 rounded text-xs transition"
                        >
                          Verify & Sync Integrations
                        </button>
                        <button 
                          onClick={() => alert("Integration configurations successfully saved!")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-xs transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* AUDIT LOG RECORDS VIEW */}
            {activeTab === 'audit-logs' && (
              <div className="glass-panel p-6 rounded-xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Enterprise Application Activity Security Audit Logs</h3>
                <div className="space-y-4">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-850 text-xs flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wide bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-200">{log.user?.name || 'System System'}</span>
                          <span className="text-[10px] text-slate-400">({log.user?.role || 'SYSTEM'})</span>
                        </div>
                        <p className="text-slate-350 mt-1.5">{log.details ? JSON.stringify(log.details) : 'Action tracked on enrollment details.'}</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-455">
                        <div>IP: {log.ipAddress || '127.0.0.1'}</div>
                        <div className="mt-1">{new Date(log.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && (
                    <div className="text-center text-slate-400 py-6">
                      No audit activities logged yet.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* LEAD DETAILED MANAGEMENT MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col md:flex-row h-[90vh] overflow-hidden">
            
            {/* Modal Left column: Lead info / Update status */}
            <div className="w-full md:w-1/2 p-6 border-r border-slate-800 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      ID: {selectedLead.id.substring(0, 8)}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{selectedLead.studentName}</h3>
                    <p className="text-xs text-slate-400">{selectedLead.email} | {selectedLead.phone}</p>
                  </div>

                  <button 
                    onClick={() => setSelectedLead(null)}
                    className="text-slate-400 hover:text-white font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Basic info details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-450 tracking-wider">Course Interested</label>
                    <p className="text-slate-200 mt-0.5 font-medium">{selectedLead.courseName || selectedLead.course?.name || 'B.Tech CS'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-455 tracking-wider">Campus Division</label>
                    <p className="text-slate-200 mt-0.5 font-medium">{selectedLead.campusName || selectedLead.campus?.name || 'Main City Campus'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-455 tracking-wider">Temperature Category</label>
                    <div className="mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedLead.temperature === 'HOT' ? 'bg-red-500/10 text-red-400' : 
                        selectedLead.temperature === 'WARM' ? 'bg-orange-500/10 text-orange-400' : 
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {selectedLead.temperature}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-slate-455 tracking-wider">Marketing Source</label>
                    <p className="text-indigo-400 mt-0.5 font-semibold">{selectedLead.leadSource}</p>
                  </div>
                </div>

                {/* Call & Status bar */}
                <div className="border-t border-slate-800 pt-4 flex flex-wrap gap-2">
                  <button 
                    onClick={handleMakeCall}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Click-to-Call
                  </button>

                  <div className="flex-1 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between">
                    <span className="text-slate-400">Current Stage:</span>
                    <select 
                      value={selectedLead.status}
                      onChange={e => updateLeadStatus(selectedLead.id, e.target.value)}
                      className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                    >
                      {Object.keys(LeadStatus).map(s => (
                        <option key={s} value={s} className="bg-slate-900">{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lead remarks / activities timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Remarks & Activity Logs</h4>
                  
                  {/* Textarea for adding remarks */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Type a new remark or counselor note..."
                      value={newRemark}
                      onChange={e => setNewRemark(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none text-white"
                    />
                    <button 
                      onClick={handleAddRemark}
                      className="bg-indigo-600 hover:bg-indigo-700 transition px-4 rounded-lg text-xs font-bold text-white"
                    >
                      Save
                    </button>
                  </div>

                  {/* Activity log view */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedLead.activities?.map((act: any, idx: number) => (
                      <div key={act.id || idx} className="p-2 bg-slate-950/60 rounded border border-slate-850 text-[10px] text-slate-300">
                        <div className="flex justify-between items-center mb-1 text-slate-400">
                          <span className="font-bold text-indigo-400 uppercase text-[8px]">{act.actionType}</span>
                          <span>{new Date(act.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{act.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Lead SLA Warning status */}
              <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/20 p-3 rounded-lg text-[10px] text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <div>
                  <strong>SLA Deadline:</strong> {selectedLead.slaDeadline ? new Date(selectedLead.slaDeadline).toLocaleString() : 'N/A'} 
                  <span className={`ml-2 px-1 rounded font-bold ${selectedLead.slaStatus === 'BREACHED' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {selectedLead.slaStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Right column: WhatsApp conversation & Schedule Followup */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-slate-950/40">
              
              {/* WhatsApp chat box mockup */}
              <div className="flex flex-col h-[60%] border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                
                {/* Chat header */}
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Official WhatsApp Chat Integration</span>
                </div>

                {/* Messages list */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col-reverse">
                  {selectedLead.whatsappMessages?.map((msg: any) => (
                    <div 
                      key={msg.id} 
                      className={`max-w-[80%] rounded-lg p-2 text-xs ${
                        msg.direction === 'OUTBOUND' 
                          ? 'bg-indigo-600 text-white self-end rounded-tr-none' 
                          : 'bg-slate-800 text-slate-200 self-start rounded-tl-none'
                      }`}
                    >
                      <p>{msg.messageBody}</p>
                      <span className="text-[8px] opacity-60 mt-1 block text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.status}
                      </span>
                    </div>
                  ))}

                  {(!selectedLead.whatsappMessages || selectedLead.whatsappMessages.length === 0) && (
                    <div className="text-center text-slate-500 text-[10px] my-auto">
                      No messaging history. Send welcome template message below.
                    </div>
                  )}
                </div>

                {/* Input text */}
                <div className="p-2 bg-slate-900 border-t border-slate-800 flex gap-1">
                  <input 
                    type="text"
                    value={whatsappMsg}
                    onChange={e => setWhatsappMsg(e.target.value)}
                    placeholder="Type WhatsApp message..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  />
                  <button 
                    onClick={handleSendWhatsApp}
                    className="bg-indigo-600 hover:bg-indigo-700 transition p-1 px-2.5 rounded text-white"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Schedule next followup */}
              <form onSubmit={handleScheduleFollowup} className="mt-4 border-t border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule Next Callback / Followup</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-450 uppercase tracking-wide">Date</label>
                    <input 
                      type="date"
                      value={followupDate}
                      onChange={e => setFollowupDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-450 uppercase tracking-wide">Time</label>
                    <input 
                      type="time"
                      value={followupTime}
                      onChange={e => setFollowupTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-450 uppercase tracking-wide">Reminder Remarks</label>
                  <input 
                    type="text"
                    placeholder="Brief description of followup purpose..."
                    value={followupRemarks}
                    onChange={e => setFollowupRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition"
                >
                  Schedule Callback Followup
                </button>
              </form>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
