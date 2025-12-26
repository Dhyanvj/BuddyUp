// src/screens/Profile/HelpSupportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { submitSupportTicket, reportBug } from '../../services/supportHelpers';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'trips' | 'payments' | 'safety' | 'account';
}

const FAQ_DATA: FAQItem[] = [
  // TRIPS
  {
    id: '1',
    category: 'trips',
    question: 'How do I create a trip?',
    answer: 'To create a trip:\n\n1. Tap the "+" (Create Trip) tab at the bottom\n2. Enter your pickup and drop-off locations\n3. Set your departure time\n4. Choose your ride service (Uber, Bolt, Lyft, etc.)\n5. Set available seats and estimated cost\n6. Tap "Create Trip"\n\nYour trip will be visible to nearby users who can request to join!',
  },
  {
    id: '2',
    category: 'trips',
    question: 'How do I join a trip?',
    answer: 'To join a trip:\n\n1. Browse available trips on the Home screen\n2. Tap on a trip to view details\n3. Review the route, time, and cost\n4. Tap "Request to Join"\n5. Select number of seats you need\n6. Wait for the trip creator to accept your request\n\nYou\'ll receive a notification when your request is accepted!',
  },
  {
    id: '3',
    category: 'trips',
    question: 'How do I leave a trip?',
    answer: 'To leave a trip:\n\n1. Go to "My Trips" tab\n2. Find the trip you want to leave\n3. Tap on the trip to view details\n4. Tap "Leave Trip" button\n5. Confirm your decision\n\nNote: Please leave as early as possible to give others time to adjust. Refund policies may apply based on timing.',
  },
  {
    id: '4',
    category: 'trips',
    question: 'Can I edit my trip after creating it?',
    answer: 'Yes! As a trip creator, you can edit trip details:\n\n1. Go to "My Trips" tab\n2. Find your created trip\n3. Tap "Edit Trip"\n4. Update details (time, seats, cost, etc.)\n5. Save changes\n\nNote: Major changes may require notifying participants. The app will send automatic notifications.',
  },
  // PAYMENTS
  {
    id: '5',
    category: 'payments',
    question: 'How does payment work?',
    answer: 'BuddyUp uses a simple cost-splitting system:\n\n1. Trip creator sets estimated total cost\n2. Cost is divided equally among all participants\n3. Payment is collected before the trip\n4. Funds are held securely\n5. Released to trip creator after trip completion\n\nWe use Stripe for secure payment processing.',
  },
  {
    id: '6',
    category: 'payments',
    question: 'How is the cost split?',
    answer: 'Cost splitting is automatic and fair:\n\n• Total trip cost ÷ Number of participants = Your share\n• Example: $20 trip with 4 people = $5 per person\n• The trip creator pays their share too\n• Extra fees (tolls, parking) can be added\n\nYou\'ll see your exact share before confirming!',
  },
  {
    id: '7',
    category: 'payments',
    question: 'What is your refund policy?',
    answer: 'Refund policy based on cancellation timing:\n\n• 24+ hours before: 100% refund\n• 12-24 hours before: 75% refund\n• 6-12 hours before: 50% refund\n• 3-6 hours before: 25% refund\n• Less than 3 hours: No refund\n\nEmergency exceptions may apply. Contact support for special circumstances.',
  },
  {
    id: '8',
    category: 'payments',
    question: 'When will I receive my refund?',
    answer: 'Refunds are processed automatically:\n\n• Approved refunds: 3-5 business days\n• Returns to original payment method\n• You\'ll receive email confirmation\n• Check your bank/card statement\n\nIf you don\'t see it after 7 days, contact support.',
  },
  // SAFETY
  {
    id: '9',
    category: 'safety',
    question: 'How do I report a user?',
    answer: 'To report inappropriate behavior:\n\n1. Go to the user\'s profile\n2. Tap the menu icon (⋮)\n3. Select "Report User"\n4. Choose reason (harassment, safety concern, etc.)\n5. Provide details\n6. Submit report\n\nWe review all reports within 24 hours and take appropriate action.',
  },
  {
    id: '10',
    category: 'safety',
    question: 'What safety features does BuddyUp have?',
    answer: 'Your safety is our priority:\n\n• User verification (email, phone, ID)\n• Rating and review system\n• In-app messaging (no personal info needed)\n• Trip tracking and sharing\n• 24/7 support team\n• Emergency contact features\n• Community guidelines enforcement\n\nAlways trust your instincts and report concerns!',
  },
  {
    id: '11',
    category: 'safety',
    question: 'What should I do in an emergency?',
    answer: 'In case of emergency:\n\n1. CALL 911 immediately for serious emergencies\n2. Use in-app emergency button to alert support\n3. Share your live location with trusted contacts\n4. Document the incident if safe to do so\n5. Contact BuddyUp support after ensuring safety\n\nYour safety comes first. Don\'t hesitate to seek help!',
  },
  {
    id: '12',
    category: 'safety',
    question: 'How can I stay safe while using BuddyUp?',
    answer: 'Safety tips for ride-sharing:\n\n• Check user ratings and reviews\n• Verify trip details before joining\n• Share trip details with friends/family\n• Meet in public, well-lit locations\n• Trust your instincts\n• Keep valuables secure\n• Use in-app messaging\n• Report suspicious behavior\n\nSee our full Safety Guidelines for more tips!',
  },
  // ACCOUNT
  {
    id: '13',
    category: 'account',
    question: 'How do I verify my account?',
    answer: 'Account verification increases trust:\n\n1. Email verification (automatic on signup)\n2. Phone verification:\n   - Go to Profile → Settings\n   - Add phone number\n   - Enter verification code\n3. ID verification (optional but recommended):\n   - Upload government ID\n   - Takes 1-2 business days\n\nVerified users get priority in trip requests!',
  },
  {
    id: '14',
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'To delete your account:\n\n1. Go to Profile → Privacy Settings\n2. Scroll to "Danger Zone"\n3. Tap "Request Account Deletion"\n4. Confirm your decision\n5. Account will be deleted within 30 days\n\nNote: This is permanent and cannot be undone. All data will be removed per GDPR requirements.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: '📚' },
    { id: 'trips', label: 'Trips', icon: '🚗' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
    { id: 'account', label: 'Account', icon: '👤' },
  ];

  const filteredFAQs = selectedCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSupport = () => {
    const email = 'support@buddyup.com';
    const subject = 'Support Request';
    const body = `Hi BuddyUp Support,\n\nUser ID: ${profile?.id}\nEmail: ${profile?.email}\n\nMy question/issue:\n\n`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSubmitSupportTicket = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'You must be logged in to submit a support ticket');
      return;
    }

    setSubmitting(true);
    try {
      const success = await submitSupportTicket(
        profile.id,
        supportSubject,
        supportMessage
      );

      if (success) {
        Alert.alert(
          'Ticket Submitted',
          'We\'ve received your support request. Our team will respond within 24 hours via email.',
          [{ text: 'OK', onPress: () => {
            setShowSupportForm(false);
            setSupportSubject('');
            setSupportMessage('');
          }}]
        );
      } else {
        throw new Error('Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      Alert.alert('Error', 'Could not submit support ticket. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBugReport = async () => {
    if (!bugDescription.trim()) {
      Alert.alert('Error', 'Please describe the bug');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'You must be logged in to report a bug');
      return;
    }

    setSubmitting(true);
    try {
      const success = await reportBug(profile.id, bugDescription);

      if (success) {
        Alert.alert(
          'Bug Reported',
          'Thank you for helping us improve BuddyUp! We\'ll investigate this issue.',
          [{ text: 'OK', onPress: () => {
            setShowBugForm(false);
            setBugDescription('');
          }}]
        );
      } else {
        throw new Error('Failed to report bug');
      }
    } catch (error) {
      console.error('Error reporting bug:', error);
      Alert.alert('Error', 'Could not submit bug report. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCommunityGuidelines = () => {
    Linking.openURL('https://buddyup.com/community-guidelines');
  };

  const openSafetyTips = () => {
    Linking.openURL('https://buddyup.com/safety-tips');
  };

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency',
      'If you\'re in immediate danger:\n\n• Call 911 (or local emergency number)\n• Get to a safe location\n• Contact trusted friends/family\n\nFor non-emergency safety concerns, you can report through the app or contact our 24/7 support.',
      [
        { text: 'Call 911', style: 'destructive', onPress: () => Linking.openURL('tel:911') },
        { text: 'Contact Support', onPress: handleContactSupport },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (showSupportForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSupportForm(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.formDescription}>
            Our support team typically responds within 24 hours. For urgent matters, please call emergency services.
          </Text>

          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            value={supportSubject}
            onChangeText={setSupportSubject}
            placeholder="Brief description of your issue"
            maxLength={100}
          />

          <Text style={styles.inputLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={supportMessage}
            onChangeText={setSupportMessage}
            placeholder="Please provide details about your issue..."
            multiline
            numberOfLines={8}
            maxLength={1000}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmitSupportTicket}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.emailButton} onPress={handleContactSupport}>
            <Text style={styles.emailButtonText}>Or email us directly</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (showBugForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowBugForm(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report a Bug</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.formDescription}>
            Help us improve BuddyUp by reporting bugs. Please include steps to reproduce the issue.
          </Text>

          <Text style={styles.inputLabel}>Bug Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bugDescription}
            onChangeText={setBugDescription}
            placeholder="What happened? What were you trying to do? What did you expect to happen?"
            multiline
            numberOfLines={10}
            maxLength={1000}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmitBugReport}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Bug Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Emergency Banner */}
        <TouchableOpacity style={styles.emergencyBanner} onPress={handleEmergency}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <View style={styles.emergencyContent}>
            <Text style={styles.emergencyTitle}>Emergency?</Text>
            <Text style={styles.emergencyText}>Tap here for immediate help</Text>
          </View>
          <Text style={styles.emergencyArrow}>→</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setShowSupportForm(true)}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setShowBugForm(true)}
            >
              <Text style={styles.quickActionIcon}>🐛</Text>
              <Text style={styles.quickActionText}>Report Bug</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ Items */}
          <View style={styles.faqList}>
            {filteredFAQs.map(faq => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Text style={styles.faqToggle}>
                    {expandedFAQ === faq.id ? '−' : '+'}
                  </Text>
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>

          <TouchableOpacity style={styles.resourceCard} onPress={openCommunityGuidelines}>
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Community Guidelines</Text>
              <Text style={styles.resourceDescription}>
                Learn about our community standards and expectations
              </Text>
            </View>
            <Text style={styles.resourceArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard} onPress={openSafetyTips}>
            <Text style={styles.resourceIcon}>🛡️</Text>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Safety Tips</Text>
              <Text style={styles.resourceDescription}>
                Essential safety guidelines for ride-sharing
              </Text>
            </View>
            <Text style={styles.resourceArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Still Need Help?</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>📧 Email Support</Text>
            <Text style={styles.contactEmail}>support@buddyup.com</Text>
            <Text style={styles.contactNote}>We typically respond within 24 hours</Text>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
              <Text style={styles.contactButtonText}>Send Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.version}>BuddyUp v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingBottom: 40,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 2,
  },
  emergencyText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  emergencyArrow: {
    fontSize: 24,
    color: '#FF3B30',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryLabelActive: {
    color: '#fff',
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#007AFF',
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  resourceArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  contactCard: {
    backgroundColor: '#E8F4FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  contactNote: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 20,
  },
  formContent: {
    padding: 16,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emailButton: {
    padding: 12,
    alignItems: 'center',
  },
  emailButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

