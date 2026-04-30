import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { leadsDB, districtsDB, franchiseesDB, tasksDB, meetingsDB, usersDB, getLastError } from '../services/db';
import { runStageAutomation, runLeadCreationAutomation, simulateAdminEmail, calculateLeadScore } from '../services/automations';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [franchisees, setFranchisees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isGlobalLeadFormOpen, setIsGlobalLeadFormOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [d, f, t, m, u] = await Promise.all([
        districtsDB.getAll(),
        franchiseesDB.getAll(),
        tasksDB.getAll(),
        meetingsDB.getAll(),
        usersDB.getAll()
      ]);
      setDistricts(d || []);
      setFranchisees(f || []);
      setTasks(t || []);
      setMeetings(m || []);
      setUsers(u || []);

      if (currentUser) {
        const l = await leadsDB.getAll(currentUser); 
        setLeads(l || []);
      }
    } catch (err) {
      console.error('Refresh Failed:', err);
      // Fallback to local storage if entire promise fails
    }
  }, [currentUser]);

  // ---- Initialize & Load ----
  useEffect(() => {
    // We'll run a migration check here or just refresh
    refresh();
  }, [currentUser, refresh]);

  // ---- Toast helpers ----
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // ---- Lead operations ----
  const createLead = useCallback(async (data) => {
    const score = calculateLeadScore(data);
    const lead = await leadsDB.create({ ...data, score });
    if (lead) {
      setLeads(prev => [lead, ...prev]);
      await runLeadCreationAutomation(lead);
      toast(`Lead "${data.firstName} ${data.lastName}" created`, 'success');
    }
    return lead;
  }, [toast]);

  const updateLead = useCallback(async (id, updates, previousStage) => {
    // If anything changes that affects score, recalculate with the full merged data
    const existingLead = leads.find(l => (l.id || l._id) === id) || {};
    
    if (updates.stage !== undefined || updates.investmentCapacity !== undefined || updates.phone !== undefined || updates.email !== undefined) {
      updates.score = calculateLeadScore({ ...existingLead, ...updates });
    }
    
    const lead = await leadsDB.update(id, updates);
    if (!lead) return null;

    setLeads(prev => prev.map(l => (l.id || l._id) === id ? { ...l, ...updates } : l));

    // Run automations when stage changes
    if (updates.stage && updates.stage !== previousStage) {
      const closerUser = users.find(u => u.role === 'Closer');
      await runStageAutomation(lead, updates.stage, closerUser, (franchisee, closedLead) => {
        const district = districts.find(d => (d.id || d._id) === closedLead.districtId);
        simulateAdminEmail(closedLead, franchisee, district);
        toast(`🎉 Franchise closed! Franchisee record created for ${district?.name || 'Assigned District'}`, 'success');
      });
    }
    return lead;
  }, [leads, toast, users]);

  const deleteLead = useCallback(async (id) => {
    const success = await leadsDB.delete(id);
    if (success) {
      setLeads(prev => prev.filter(l => (l.id || l._id) !== id));
      toast('Lead deleted', 'info');
    }
  }, [toast]);

  const bulkUpdateLeads = useCallback(async (ids, updates) => {
    await leadsDB.bulkUpdate(ids, updates);
    setLeads(prev => prev.map(l => ids.includes(l.id || l._id) ? { ...l, ...updates } : l));
    toast(`${ids.length} leads updated`, 'success');
  }, [toast]);

  const bulkDeleteLeads = useCallback(async (ids) => {
    const success = await leadsDB.bulkDelete(ids);
    if (success) {
      setLeads(prev => prev.filter(l => !ids.includes(l.id || l._id)));
      toast(`${ids.length} leads deleted`, 'info');
    }
  }, [toast]);

  const importLeads = useCallback(async (records) => {
    const res = await leadsDB.bulkCreate(records);
    if (res) {
      const newItems = Array.isArray(res) ? res : records.map(r => ({ ...r, id: `temp_${Date.now()}_${Math.random()}` }));
      setLeads(prev => [...newItems, ...prev]);
      const count = Array.isArray(res) ? res.length : records.length;
      toast(`${count} leads imported successfully`, 'success');
    } else {
      const err = getLastError();
      toast(`Import failed: ${err || 'Server Error'}. Saved locally.`, 'warning');
      await refresh();
    }
  }, [refresh, toast]);

  // ---- District operations ----
  const updateDistrict = useCallback(async (id, updates) => {
    const success = await districtsDB.update(id, updates);
    if (success !== false) {
      setDistricts(prev => prev.map(d => (d.id || d._id) === id ? { ...d, ...updates } : d));
      toast('District updated', 'success');
    }
    return success;
  }, [toast]);

  const createDistrict = useCallback(async (data) => {
    const d = await districtsDB.create(data);
    if (d) {
      setDistricts(prev => [d, ...prev]);
      toast('District created', 'success');
    }
    return d;
  }, [toast]);

  const deleteDistrict = useCallback(async (id) => {
    const isTied = franchisees.some(f => f.districtId === id);
    if (isTied) {
      toast('Cannot delete district: A Franchise partner is currently assigned to it.', 'error');
      return false;
    }
    const success = await districtsDB.delete(id);
    if (success) {
      setDistricts(prev => prev.filter(d => (d.id || d._id) !== id));
      toast('District deleted', 'info');
      return true;
    }
    return false;
  }, [toast, franchisees]);

  const bulkDeleteDistricts = useCallback(async (ids) => {
    const tied = ids.filter(id => franchisees.some(f => f.districtId === id));
    if (tied.length > 0) {
      toast(`Cannot delete ${tied.length} district(s): They have active Franchise partners assigned.`, 'error');
      return false;
    }
    
    let success = false;
    if (!districtsDB.bulkDelete) {
      // fallback if bulkDelete not available
      for (const id of ids) await districtsDB.delete(id);
      success = true;
    } else {
      success = await districtsDB.bulkDelete(ids);
    }

    if (success) {
      setDistricts(prev => prev.filter(d => !ids.includes(d.id || d._id)));
      toast(`${ids.length} districts deleted`, 'info');
      return true;
    }
    return false;
  }, [toast, franchisees]);

  const importDistricts = useCallback(async (records) => {
    const res = await districtsDB.bulkCreate(records);
    if (res) {
      const newItems = Array.isArray(res) ? res : records.map(r => ({ ...r, id: `temp_${Date.now()}_${Math.random()}` }));
      setDistricts(prev => [...newItems, ...prev]);
      toast(`${records.length} districts imported`, 'success');
      return newItems;
    } else {
      const err = getLastError();
      toast(`Import failed: ${err || 'Server Offline'}. Saved locally.`, 'warning');
      await refresh();
      return null;
    }
  }, [refresh, toast]);

  // ---- Franchisee operations ----
  const updateFranchisee = useCallback(async (id, updates) => {
    const existing = franchisees.find(f => (f.id || f._id) === id);
    
    // Update state optimistically to prevent focus loss in textareas
    setFranchisees(prev => prev.map(f => (f.id || f._id) === id ? { ...f, ...updates } : f));
    
    const f = await franchiseesDB.update(id, updates);
    
    // Trigger activation flow if status changed to Active
    if (updates.status === 'Active' && (!existing || existing.status !== 'Active')) {
      const closerUser = users.find(u => u.role === 'Closer');
      const { runFranchiseActivationAutomation } = await import('../services/automations');
      await runFranchiseActivationAutomation(f || { ...existing, ...updates }, closerUser?.id || currentUser?.id);
      toast(`🚀 Franchise Activated! Activation tasks generated for ${existing?.name || 'Partner'}`, 'success');
      await refresh(); // Refresh for new tasks
    } else {
      // For minor updates like notes, don't toast or refresh everything
      if (!updates.notes && updates.notes !== '') {
        toast('Franchisee updated', 'success');
        await refresh();
      }
    }
    
    return f;
  }, [refresh, toast, franchisees, users, currentUser]);

  const createFranchisee = useCallback(async (data) => {
    const f = await franchiseesDB.create(data);
    await refresh();
    toast('Franchise Partner created', 'success');
    return f;
  }, [refresh, toast]);

  const deleteFranchisee = useCallback(async (id) => {
    await franchiseesDB.delete(id);
    await refresh();
    toast('Franchisee deleted', 'info');
  }, [refresh, toast]);

  const bulkDeleteFranchisees = useCallback(async (ids) => {
    await franchiseesDB.bulkDelete(ids);
    await refresh();
    toast(`${ids.length} franchisees deleted`, 'info');
  }, [refresh, toast]);

  const importFranchisees = useCallback(async (records) => {
    const res = await franchiseesDB.bulkCreate(records);
    await refresh();
    if (res) {
      toast(`${records.length} franchisees imported`, 'success');
    } else {
      const err = getLastError();
      toast(`Import failed: ${err || 'Server Offline'}. Saved locally.`, 'warning');
    }
  }, [refresh, toast]);

  // ---- Task operations ----
  const createTask = useCallback(async (data) => {
    const t = await tasksDB.create(data);
    await refresh();
    return t;
  }, [refresh]);

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => (t.id || t._id) === id);
    if (task) {
      await tasksDB.update(id, { done: !task.done });
      await refresh();
    }
  }, [tasks, refresh]);

  const deleteTask = useCallback(async (id) => {
    await tasksDB.delete(id);
    await refresh();
  }, [refresh]);

  const updateTask = useCallback(async (id, updates) => {
    await tasksDB.update(id, updates);
    await refresh();
  }, [refresh]);

  // ---- Meeting operations ----
  const createMeeting = useCallback(async (data) => {
    const m = await meetingsDB.create(data);
    await refresh();
    toast('Meeting scheduled', 'success');
    return m;
  }, [refresh, toast]);

  const updateMeeting = useCallback(async (id, updates) => {
    await meetingsDB.update(id, updates);
    await refresh();
    toast('Meeting updated', 'success');
  }, [refresh, toast]);

  const deleteMeeting = useCallback(async (id) => {
    await meetingsDB.delete(id);
    setMeetings(prev => prev.filter(m => (m.id || m._id) !== id));
    toast('Meeting deleted', 'info');
  }, [toast]);

  // ---- User operations ----
  const createUser = useCallback(async (data) => {
    const res = await usersDB.create(data);
    if (res) {
      setUsers(prev => [res, ...prev]);
      if (res.inviteSent) toast(`User "${data.name}" invited successfully`, 'success');
      else toast(`User "${data.name}" created (Invite failed)`, 'warning');
    }
    return res;
  }, [toast]);

  const updateUser = useCallback(async (id, updates) => {
    const res = await usersDB.update(id, updates);
    if (res) {
      setUsers(prev => prev.map(u => (u.id || u._id) === id ? { ...u, ...updates } : u));
      toast('User updated', 'success');
    }
    return res;
  }, [toast]);

  const deleteUser = useCallback(async (id) => {
    const success = await usersDB.delete(id);
    if (success) {
      setUsers(prev => prev.filter(u => (u.id || u._id) !== id));
      toast('User removed', 'info');
    }
    return success;
  }, [toast]);

  const bulkDeleteUsers = useCallback(async (ids) => {
    const success = await usersDB.bulkDelete(ids);
    if (success) {
      setUsers(prev => prev.filter(u => !ids.includes(u.id || u._id)));
      toast(`${ids.length} users removed`, 'info');
    }
    return success;
  }, [toast]);

  return (
    <AppContext.Provider value={{
      leads, districts, franchisees, tasks, meetings, users,
      toasts, toast,
      createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, importLeads,
      updateDistrict, createDistrict, deleteDistrict, bulkDeleteDistricts, importDistricts,
      updateFranchisee, createFranchisee, deleteFranchisee, bulkDeleteFranchisees, importFranchisees,
      createTask, toggleTask, deleteTask, updateTask,
      createMeeting, updateMeeting, deleteMeeting,
      createUser, updateUser, deleteUser, bulkDeleteUsers,
      refresh,
      loading, setLoading,
      isGlobalLeadFormOpen, setIsGlobalLeadFormOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
