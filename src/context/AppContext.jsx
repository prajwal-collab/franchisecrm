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

  const refresh = useCallback(async () => {
    try {
      const [d, f, t, m] = await Promise.all([
        districtsDB.getAll(),
        franchiseesDB.getAll(),
        tasksDB.getAll(),
        meetingsDB.getAll()
      ]);
      setDistricts(d);
      setFranchisees(f);
      setTasks(t);
      setMeetings(m);

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
  const createLead = useCallback((data) => {
    const score = calculateLeadScore(data);
    const lead = leadsDB.create({ ...data, score });
    runLeadCreationAutomation(lead);
    refresh();
    toast(`Lead "${data.firstName} ${data.lastName}" created`, 'success');
    return lead;
  }, [refresh, toast]);

  const updateLead = useCallback((id, updates, previousStage) => {
    if (updates.stage) {
      updates.score = calculateLeadScore({ ...updates });
    }
    const lead = leadsDB.update(id, updates);
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
    refresh();
    return lead;
  }, [refresh, toast, users]);

  const deleteLead = useCallback((id) => {
    leadsDB.delete(id);
    refresh();
    toast('Lead deleted', 'info');
  }, [refresh, toast]);

  const bulkUpdateLeads = useCallback((ids, updates) => {
    leadsDB.bulkUpdate(ids, updates);
    refresh();
    toast(`${ids.length} leads updated`, 'success');
  }, [refresh, toast]);

  const bulkDeleteLeads = useCallback((ids) => {
    leadsDB.bulkDelete(ids);
    refresh();
    toast(`${ids.length} leads deleted`, 'info');
  }, [refresh, toast]);

  const importLeads = useCallback(async (records) => {
    await leadsDB.bulkCreate(records);
    refresh();
    toast(`${records.length} leads imported`, 'success');
  }, [refresh, toast]);

  // ---- District operations ----
  const updateDistrict = useCallback((id, updates) => {
    districtsDB.update(id, updates);
    refresh();
    toast('District updated', 'success');
  }, [refresh, toast]);

  const createDistrict = useCallback((data) => {
    const d = districtsDB.create(data);
    refresh();
    toast('District created', 'success');
    return d;
  }, [refresh, toast]);

  const importDistricts = useCallback(async (records) => {
    await districtsDB.bulkCreate(records);
    refresh();
    toast(`${records.length} districts imported`, 'success');
  }, [refresh, toast]);

  // ---- Franchisee operations ----
  const updateFranchisee = useCallback((id, updates) => {
    const f = franchiseesDB.update(id, updates);
    refresh();
    toast('Franchisee updated', 'success');
    return f;
  }, [refresh, toast]);

  const createFranchisee = useCallback((data) => {
    const f = franchiseesDB.create(data);
    refresh();
    toast('Franchise Partner created', 'success');
    return f;
  }, [refresh, toast]);

  const deleteFranchisee = useCallback((id) => {
    franchiseesDB.delete(id);
    refresh();
    toast('Franchisee deleted', 'info');
  }, [refresh, toast]);

  const importFranchisees = useCallback(async (records) => {
    await franchiseesDB.bulkCreate(records);
    refresh();
    toast(`${records.length} franchisees imported`, 'success');
  }, [refresh, toast]);

  // ---- Task operations ----
  const createTask = useCallback((data) => {
    const t = tasksDB.create(data);
    refresh();
    return t;
  }, [refresh]);

  const toggleTask = useCallback((id) => {
    tasksDB.toggle(id);
    refresh();
  }, [refresh]);

  const deleteTask = useCallback((id) => {
    tasksDB.delete(id);
    refresh();
  }, [refresh]);

  const updateTask = useCallback((id, updates) => {
    tasksDB.update(id, updates);
    refresh();
  }, [refresh]);

  // ---- Meeting operations ----
  const createMeeting = useCallback((data) => {
    const m = meetingsDB.create(data);
    refresh();
    toast('Meeting scheduled', 'success');
    return m;
  }, [refresh, toast]);

  const updateMeeting = useCallback((id, updates) => {
    meetingsDB.update(id, updates);
    refresh();
    toast('Meeting updated', 'success');
  }, [refresh, toast]);

  const deleteMeeting = useCallback((id) => {
    meetingsDB.delete(id);
    refresh();
    toast('Meeting deleted', 'info');
  }, [refresh, toast]);

  return (
    <AppContext.Provider value={{
      leads, districts, franchisees, tasks, meetings, users,
      toasts, toast,
      createLead, updateLead, deleteLead, bulkUpdateLeads, bulkDeleteLeads, importLeads,
      updateDistrict, createDistrict, importDistricts,
      updateFranchisee, createFranchisee, deleteFranchisee, importFranchisees,
      createTask, toggleTask, deleteTask, updateTask,
      createMeeting, updateMeeting, deleteMeeting,
      refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
