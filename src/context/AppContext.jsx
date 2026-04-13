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
    runLeadCreationAutomation(lead);
    await refresh();
    toast(`Lead "${data.firstName} ${data.lastName}" created`, 'success');
    return lead;
  }, [refresh, toast]);

  const updateLead = useCallback(async (id, updates, previousStage) => {
    // If anything changes that affects score, recalculate with the full merged data
    const existingLead = leads.find(l => (l.id || l._id) === id) || {};
    
    if (updates.stage !== undefined || updates.investmentCapacity !== undefined || updates.phone !== undefined || updates.email !== undefined) {
      updates.score = calculateLeadScore({ ...existingLead, ...updates });
    }
    
    const lead = await leadsDB.update(id, updates);
    if (!lead) return null;

    // Run automations when stage changes
    if (updates.stage && updates.stage !== previousStage) {
      const closerUser = users.find(u => u.role === 'Closer');
      runStageAutomation(lead, updates.stage, closerUser, (franchisee, closedLead) => {
        const district = districtsDB.getById(closedLead.districtId);
        simulateAdminEmail(closedLead, franchisee, district);
        toast(`🎉 Franchise closed! Franchisee record created for ${district?.name}`, 'success');
      });
    }
    await refresh();
    return lead;
  }, [refresh, toast, users]);

  const deleteLead = useCallback(async (id) => {
    await leadsDB.delete(id);
    await refresh();
    toast('Lead deleted', 'info');
  }, [refresh, toast]);

  const bulkUpdateLeads = useCallback(async (ids, updates) => {
    await leadsDB.bulkUpdate(ids, updates);
    await refresh();
    toast(`${ids.length} leads updated`, 'success');
  }, [refresh, toast]);

  const bulkDeleteLeads = useCallback(async (ids) => {
    await leadsDB.bulkDelete(ids);
    await refresh();
    toast(`${ids.length} leads deleted`, 'info');
  }, [refresh, toast]);

  const importLeads = useCallback(async (records) => {
    const res = await leadsDB.bulkCreate(records);
    await refresh();
    if (res) {
      toast(`${records.length} leads imported successfully to server`, 'success');
    } else {
      const err = getLastError();
      toast(`Import failed: ${err || 'Server Error'}. Saved locally.`, 'warning');
    }
  }, [refresh, toast]);

  // ---- District operations ----
  const updateDistrict = useCallback(async (id, updates) => {
    await districtsDB.update(id, updates);
    await refresh();
    toast('District updated', 'success');
  }, [refresh, toast]);

  const createDistrict = useCallback(async (data) => {
    const d = await districtsDB.create(data);
    await refresh();
    toast('District created', 'success');
    return d;
  }, [refresh, toast]);

  const deleteDistrict = useCallback(async (id) => {
    const isTied = franchisees.some(f => f.districtId === id);
    if (isTied) {
      toast('Cannot delete district: A Franchise partner is currently assigned to it.', 'error');
      return false;
    }
    await districtsDB.delete(id);
    await refresh();
    toast('District deleted', 'info');
    return true;
  }, [refresh, toast, franchisees]);

  const bulkDeleteDistricts = useCallback(async (ids) => {
    const tied = ids.filter(id => franchisees.some(f => f.districtId === id));
    if (tied.length > 0) {
      toast(`Cannot delete ${tied.length} district(s): They have active Franchise partners assigned.`, 'error');
      return false;
    }
    if (!districtsDB.bulkDelete) {
      // fallback if bulkDelete not available
      for (const id of ids) await districtsDB.delete(id);
    } else {
      await districtsDB.bulkDelete(ids);
    }
    await refresh();
    toast(`${ids.length} districts deleted`, 'info');
    return true;
  }, [refresh, toast, franchisees, districts]);

  const importDistricts = useCallback(async (records) => {
    const res = await districtsDB.bulkCreate(records);
    await refresh();
    if (res) {
      toast(`${records.length} districts imported`, 'success');
    } else {
      const err = getLastError();
      toast(`Import failed: ${err || 'Server Offline'}. Saved locally.`, 'warning');
    }
  }, [refresh, toast]);

  // ---- Franchisee operations ----
  const updateFranchisee = useCallback(async (id, updates) => {
    const existing = franchisees.find(f => (f.id || f._id) === id);
    const f = await franchiseesDB.update(id, updates);
    
    // Trigger activation flow if status changed to Active
    if (updates.status === 'Active' && (!existing || existing.status !== 'Active')) {
      const closerUser = users.find(u => u.role === 'Closer');
      const { runFranchiseActivationAutomation } = await import('../services/automations');
      runFranchiseActivationAutomation(f, closerUser?.id || currentUser?.id);
      toast(`🚀 Franchise Activated! Activation tasks generated for ${f.name}`, 'success');
    } else {
      toast('Franchisee updated', 'success');
    }
    
    await refresh();
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
    await refresh();
    toast('Meeting deleted', 'info');
  }, [refresh, toast]);

  return (
    <AppContext.Provider value={{
      leads, districts, franchisees, tasks, meetings, users,
      toasts, toast,
      createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, importLeads,
      updateDistrict, createDistrict, deleteDistrict, bulkDeleteDistricts, importDistricts,
      updateFranchisee, createFranchisee, deleteFranchisee, bulkDeleteFranchisees, importFranchisees,
      createTask, toggleTask, deleteTask, updateTask,
      createMeeting, updateMeeting, deleteMeeting,
      refresh,
      isGlobalLeadFormOpen, setIsGlobalLeadFormOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
