import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { leadsDB, districtsDB, franchiseesDB, tasksDB, meetingsDB, usersDB } from '../services/db';
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
      setDistricts(d);
      setFranchisees(f);
      setTasks(t);
      setMeetings(m);
      setUsers(u);

      if (currentUser) {
        const l = await leadsDB.getAll(); 
        // Backend handles row-level security or we filter here for now
        setLeads(currentUser.role === 'SDR' ? l.filter(x => x.assignedTo === currentUser.id) : l);
      }
    } catch (err) {
      console.error('Refresh Failed:', err);
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
    if (updates.stage) {
      updates.score = calculateLeadScore({ ...updates });
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
      toast(`${records.length} leads imported to local storage (Backend save failed)`, 'warning');
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

  const importDistricts = useCallback(async (records) => {
    await districtsDB.bulkCreate(records);
    refresh();
    toast(`${records.length} districts imported`, 'success');
  }, [refresh, toast]);

  // ---- Franchisee operations ----
  const updateFranchisee = useCallback(async (id, updates) => {
    const f = await franchiseesDB.update(id, updates);
    await refresh();
    toast('Franchisee updated', 'success');
    return f;
  }, [refresh, toast]);

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
    await franchiseesDB.bulkCreate(records);
    await refresh();
    toast(`${records.length} franchisees imported`, 'success');
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
      updateDistrict, createDistrict, importDistricts,
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
