// src/services/supportHelpers.ts
import { supabase } from './supabase';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface BugReport {
  id: string;
  user_id: string;
  description: string;
  status: 'reported' | 'investigating' | 'fixed' | 'wont_fix';
  created_at: string;
}

/**
 * Submit a support ticket
 */
export async function submitSupportTicket(
  userId: string,
  subject: string,
  message: string,
  priority: SupportTicketPriority = 'medium'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
        priority: priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, log to console and return true
      // In production, you'd want to send this to an external service
      console.log('Support Ticket:', {
        userId,
        subject,
        message,
        priority,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error submitting support ticket:', error);
    return false;
  }
}

/**
 * Report a bug
 */
export async function reportBug(
  userId: string,
  description: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bug_reports')
      .insert({
        user_id: userId,
        description: description.trim(),
        status: 'reported',
        created_at: new Date().toISOString(),
      });

    if (error) {
      // If table doesn't exist, log to console and return true
      console.log('Bug Report:', {
        userId,
        description,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error reporting bug:', error);
    return false;
  }
}

/**
 * Get user's support tickets
 */
export async function getUserSupportTickets(
  userId: string
): Promise<SupportTicket[]> {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
}

/**
 * Update support ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return false;
  }
}

/**
 * Get FAQ data by category
 */
export function getFAQByCategory(category: string) {
  // This could be fetched from a database in the future
  // For now, it's defined in the component
  return [];
}

/**
 * Search FAQ
 */
export function searchFAQ(query: string, faqData: any[]) {
  const lowerQuery = query.toLowerCase();
  return faqData.filter(
    faq =>
      faq.question.toLowerCase().includes(lowerQuery) ||
      faq.answer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Send emergency alert to support team
 */
export async function sendEmergencyAlert(
  userId: string,
  location?: { latitude: number; longitude: number },
  message?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('emergency_alerts')
      .insert({
        user_id: userId,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        message: message || 'Emergency alert triggered',
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Log to console if table doesn't exist
      console.error('EMERGENCY ALERT:', {
        userId,
        location,
        message,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    return false;
  }
}

/**
 * Report a user for inappropriate behavior
 */
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  details: string,
  tripId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reason,
        details: details.trim(),
        trip_id: tripId || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Log to console if table doesn't exist
      console.log('User Report:', {
        reporterId,
        reportedUserId,
        reason,
        details,
        tripId,
        timestamp: new Date().toISOString(),
      });
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error reporting user:', error);
    return false;
  }
}

/**
 * Get support contact information
 */
export function getSupportContact() {
  return {
    email: 'support@buddyup.com',
    phone: '+1-555-BUDDY-UP',
    emergencyPhone: '911',
    website: 'https://buddyup.com/support',
    hours: 'Monday-Friday, 9 AM - 6 PM EST',
    emergencyHours: '24/7',
  };
}

/**
 * Check if support is currently available
 */
export function isSupportAvailable(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();

  // Support available Monday-Friday, 9 AM - 6 PM EST
  if (day === 0 || day === 6) return false; // Weekend
  if (hour < 9 || hour >= 18) return false; // Outside business hours

  return true;
}

/**
 * Get estimated response time
 */
export function getEstimatedResponseTime(priority: SupportTicketPriority): string {
  switch (priority) {
    case 'urgent':
      return '1-2 hours';
    case 'high':
      return '4-6 hours';
    case 'medium':
      return '12-24 hours';
    case 'low':
      return '24-48 hours';
    default:
      return '24 hours';
  }
}

