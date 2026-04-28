// ============================================================
// Automations Service – Stage transitions, task creation, etc.
// ============================================================
import { tasksDB, districtsDB, franchiseesDB, getNextSDR } from './db';

// Task due date helpers
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();
const daysFromDate = (dateStr, n) => new Date(new Date(dateStr).getTime() + n * 86400000).toISOString();

// ---- Stage Transition Auto-Tasks ----
export function runStageAutomation(lead, newStage, closer, onFranchiseeCreated) {
  switch (newStage) {
    case 'Contacted':
      break; // No automation

    case 'Follow Up':
      if (lead.followUpDate) {
        tasksDB.create({
          title: `Follow up with ${lead.firstName} ${lead.lastName}`,
          leadId: lead.id || lead._id,
          assignedTo: lead.assignedTo,
          dueDate: new Date(lead.followUpDate).toISOString(),
        });
      }
      break;

    case 'Interested':
      tasksDB.create({
        title: 'Schedule webinar invitation',
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        dueDate: daysFromNow(2),
      });
      break;

    case 'Webinar Registered':
      tasksDB.create({
        title: 'Send reminder to lead about webinar',
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        dueDate: daysFromNow(1),
      });
      break;

    case 'Webinar Attended':
      tasksDB.create({
        title: 'Schedule 1:1 follow-up call',
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        dueDate: daysFromNow(3),
      });
      break;

    case '1:1 Scheduled':
      break;

    case 'Qualified':
      tasksDB.create({
        title: 'Begin negotiation with lead',
        leadId: lead.id,
        assignedTo: closer?.id || lead.assignedTo,
        dueDate: daysFromNow(5),
      });
      break;

    case 'Negotiation':
      break;

    case 'Closed Won': {
      // 1. Create Franchisee record
      const franchisee = franchiseesDB.create({
        name: `${lead.firstName} ${lead.lastName}`,
        contactPerson: `${lead.firstName} ${lead.lastName}`,
        phone: lead.phone,
        email: lead.email,
        districtId: lead.districtId,
        onboardingDate: new Date().toISOString(),
        tokenAmount: 0,
        committedAmount: 0,
        receivedAmount: 0,
        balanceDue: 0,
        paymentStatus: 'Partial',
        sourceOfLead: lead.source,
        notes: lead.notes || '',
        leadId: lead.id,
      });

      // 2. Update district status to Sold
      if (lead.districtId) {
        districtsDB.markSold(lead.districtId, franchisee.id);
      }

      // 3. Task for Closer
      tasksDB.create({
        title: 'Send onboarding pack and payment link',
        leadId: lead.id,
        franchiseeId: franchisee.id,
        assignedTo: closer?.id || lead.assignedTo,
        dueDate: daysFromNow(1),
      });

      // 4. Callback to update UI and simulate admin email
      if (onFranchiseeCreated) onFranchiseeCreated(franchisee, lead);
      break;
    }

    case 'Closed Lost':
      tasksDB.create({
        title: 'Add to nurture list, follow up in 90 days',
        leadId: lead.id,
        assignedTo: lead.assignedTo,
        dueDate: daysFromNow(90),
      });
      break;

    default:
      break;
  }
}

// ---- Lead Creation Automation ----
export function runLeadCreationAutomation(lead) {
  // Assign SDR (already done in form, but create task)
  tasksDB.create({
    title: 'Call lead within 24h',
    leadId: lead.id,
    assignedTo: lead.assignedTo,
    dueDate: daysFromNow(1),
  });
}

// ---- Payment Reminder Task ----
export function createPaymentReminderTask(franchisee, closerId) {
  tasksDB.create({
    title: `Remind franchisee about pending payment – ${franchisee.name}`,
    franchiseeId: franchisee.id,
    assignedTo: closerId,
    dueDate: daysFromNow(3),
  });
}

// ---- Franchise Activation Flow ----
export function runFranchiseActivationAutomation(franchisee, assignedTo) {
  const steps = [
    { title: 'Complete Legal Paperwork & Agreement', delay: 1 },
    { title: 'Setup Sales Material & Brand Kit', delay: 2 },
    { title: 'Initial Partner Training Session', delay: 3 },
    { title: 'Marketing Support Kickoff', delay: 5 },
    { title: 'Setup CRM Access & Dashboard', delay: 0 }
  ];

  steps.forEach(step => {
    tasksDB.create({
      title: `${step.title} – ${franchisee.name}`,
      franchiseeId: franchisee.id || franchisee._id,
      assignedTo: assignedTo,
      dueDate: daysFromNow(step.delay),
      done: false
    });
  });
}

// ---- Meeting Reminder Task ----
export function createMeetingReminderTask(meeting, leadId, sdrId) {
  const reminderDate = daysFromDate(meeting.scheduledDateTime, -1);
  tasksDB.create({
    title: 'Send reminder to lead about meeting tomorrow',
    leadId,
    meetingId: meeting.id,
    assignedTo: sdrId,
    dueDate: reminderDate,
  });
}

// ---- Simulate admin email notification ----
export function simulateAdminEmail(lead, franchisee, district) {
  const subject = `New Franchise Closed: ${district?.name || 'Unknown District'}`;
  const body = `
Congratulations! A new franchise has been closed.

Lead Details:
  Name: ${lead.firstName} ${lead.lastName}
  Phone: ${lead.phone}
  Email: ${lead.email}
  District: ${district?.name || 'N/A'}
  Stage: Closed Won

Franchisee Record:
  Name: ${franchisee.name}
  Contact: ${franchisee.contactPerson}
  Phone: ${franchisee.phone}
  Email: ${franchisee.email}
  Onboarding Date: ${new Date(franchisee.onboardingDate).toLocaleDateString()}

To: admin@earlyjobs.co.in
  `.trim();

  // In a real app, send via API. Here we log and store as notification.
  console.log('📧 Admin Email:', subject);
  console.log(body);
  return { subject, body };
}

// ---- Lead Score calculation ----
export function calculateLeadScore(lead) {
  let score = 0;
  const stageScores = {
    'New Lead': 5, 'Contacted': 15, 'Interested': 30, 'Webinar Registered': 40,
    'Webinar Attended': 55, '1:1 Scheduled': 65, 'Qualified': 75,
    'Negotiation': 87, 'Closed Won': 100, 'Closed Lost': 0, 'Unqualified Lead': 0,
  };
  score += stageScores[lead.stage] || 0;
  if (lead.investmentCapacity === '5L+') score = Math.min(100, score + 10);
  if (lead.investmentCapacity === '3L–5L') score = Math.min(100, score + 5);
  return score;
}
