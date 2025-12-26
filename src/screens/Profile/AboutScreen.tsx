// src/screens/Profile/AboutScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();
  const APP_VERSION = '1.0.0';

  const openWebsite = () => {
    Linking.openURL('https://buddyup.com');
  };

  const openTwitter = () => {
    Linking.openURL('https://twitter.com/buddyup');
  };

  const openInstagram = () => {
    Linking.openURL('https://instagram.com/buddyup');
  };

  const openFacebook = () => {
    Linking.openURL('https://facebook.com/buddyup');
  };

  const openLinkedIn = () => {
    Linking.openURL('https://linkedin.com/company/buddyup');
  };

  const sendEmail = () => {
    Linking.openURL('mailto:hello@buddyup.com');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About BuddyUp</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.appName}>BuddyUp</Text>
          <Text style={styles.tagline}>Share rides, split costs, make friends</Text>
          <Text style={styles.version}>Version {APP_VERSION}</Text>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            BuddyUp was created to make travel more affordable, sustainable, and social. 
            We believe that sharing rides shouldn't just save money—it should create 
            connections and build communities.
          </Text>
          <Text style={styles.paragraph}>
            Whether you're commuting to work, heading to the airport, or planning a road 
            trip, BuddyUp helps you find travel companions who are going your way. Split 
            costs, reduce your carbon footprint, and maybe make a new friend along the way.
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create or Find a Trip</Text>
              <Text style={styles.stepDescription}>
                Post your upcoming trip or browse rides near you. Set your pickup, 
                destination, and departure time.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect with Travel Buddies</Text>
              <Text style={styles.stepDescription}>
                Request to join trips or accept requests from others. Check profiles, 
                ratings, and reviews before confirming.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Split Costs Fairly</Text>
              <Text style={styles.stepDescription}>
                The app automatically calculates each person's share. Pay securely 
                through the app with no awkward money exchanges.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Travel & Enjoy</Text>
              <Text style={styles.stepDescription}>
                Share the ride, share the experience. After your trip, leave reviews 
                to help build a trusted community.
              </Text>
            </View>
          </View>
        </View>

        {/* Safety & Trust */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Trust</Text>
          <Text style={styles.paragraph}>
            Your safety is our top priority. We've built multiple layers of protection 
            to ensure you can travel with confidence:
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>User Verification</Text>
                <Text style={styles.featureDescription}>
                  Email, phone, and optional ID verification for all users
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Rating System</Text>
                <Text style={styles.featureDescription}>
                  Transparent reviews and ratings help you choose trustworthy companions
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Secure Payments</Text>
                <Text style={styles.featureDescription}>
                  All transactions processed securely through Stripe
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>24/7 Support</Text>
                <Text style={styles.featureDescription}>
                  Our support team is always available to help with any concerns
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Privacy Controls</Text>
                <Text style={styles.featureDescription}>
                  Granular privacy settings let you control who sees your information
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Emergency Features</Text>
                <Text style={styles.featureDescription}>
                  Quick access to emergency services and trip sharing with trusted contacts
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Why Choose BuddyUp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose BuddyUp?</Text>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>💰</Text>
            <Text style={styles.benefitTitle}>Save Money</Text>
            <Text style={styles.benefitDescription}>
              Split ride costs and save up to 75% on transportation expenses
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>🌍</Text>
            <Text style={styles.benefitTitle}>Help the Planet</Text>
            <Text style={styles.benefitDescription}>
              Reduce carbon emissions by sharing rides instead of traveling alone
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>👥</Text>
            <Text style={styles.benefitTitle}>Make Connections</Text>
            <Text style={styles.benefitDescription}>
              Meet interesting people and expand your social network
            </Text>
          </View>

          <View style={styles.benefitCard}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitTitle}>Travel Smarter</Text>
            <Text style={styles.benefitDescription}>
              Find rides quickly with our intelligent matching system
            </Text>
          </View>
        </View>

        {/* Our Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.paragraph}>
            BuddyUp was founded in 2024 by a team of passionate travelers who believed 
            there had to be a better way to get around. After countless expensive solo 
            rides and missed opportunities to connect with fellow travelers, we decided 
            to build the solution ourselves.
          </Text>
          <Text style={styles.paragraph}>
            Today, BuddyUp is helping thousands of people save money, reduce their 
            environmental impact, and make meaningful connections. We're just getting 
            started, and we're excited to have you along for the ride.
          </Text>
        </View>

        {/* Contact & Social */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>

          <TouchableOpacity style={styles.linkCard} onPress={openWebsite}>
            <Text style={styles.linkIcon}>🌐</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Website</Text>
              <Text style={styles.linkUrl}>buddyup.com</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={sendEmail}>
            <Text style={styles.linkIcon}>📧</Text>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>Email</Text>
              <Text style={styles.linkUrl}>hello@buddyup.com</Text>
            </View>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.socialTitle}>Follow Us</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton} onPress={openTwitter}>
              <Text style={styles.socialButtonText}>𝕏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={openInstagram}>
              <Text style={styles.socialButtonText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={openFacebook}>
              <Text style={styles.socialButtonText}>f</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={openLinkedIn}>
              <Text style={styles.socialButtonText}>in</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => Linking.openURL('https://buddyup.com/terms')}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://buddyup.com/privacy')}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>•</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://buddyup.com/community')}>
            <Text style={styles.legalLink}>Community Guidelines</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for travelers everywhere</Text>
          <Text style={styles.copyright}>© 2024 BuddyUp. All rights reserved.</Text>
        </View>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8f8f8',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 20,
    color: '#34C759',
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  linkIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 14,
    color: '#007AFF',
  },
  linkArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  legalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flexWrap: 'wrap',
  },
  legalLink: {
    fontSize: 13,
    color: '#007AFF',
    paddingHorizontal: 8,
  },
  legalSeparator: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
  },
});

