# BuddyUp

A modern React Native friend-finding app built with TypeScript, featuring intelligent matching algorithms, real-time messaging, and comprehensive safety features.

## Overview

BuddyUp is a full-stack mobile application designed to help men find meaningful friendships based on shared interests and preferences. The app features a sophisticated matching system, real-time chat functionality, and robust safety mechanisms including blocking and reporting capabilities.

## Tech Stack

### Frontend

- **React Native** with Expo SDK 54
- **TypeScript** for type safety and developer experience
- **NativeWind** (Tailwind CSS for React Native) for styling
- **React Navigation** for navigation management
- **React Native Reanimated** for smooth animations
- **React Native Gesture Handler** for touch interactions

### Backend & Infrastructure

- **Supabase** as Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions for messaging
  - Authentication and user management
  - Edge Functions for server-side logic
- **Expo Secure Store** for secure token storage
- **AsyncStorage** for local data persistence

### Development Tools

- **TypeScript** with strict type checking
- **Prettier** with Tailwind CSS plugin
- **ESLint** for code quality
- **Faker.js** for development data seeding

## Architecture Highlights

### Repository Pattern

The app implements a clean repository pattern for data access, separating business logic from data persistence. The CandidatesRepository handles user discovery logic with sophisticated scoring algorithms based on shared interests, filtering out blocked users and previously liked profiles, and implementing deprioritization for left-swiped profiles.

### Real-Time Features

Implements real-time messaging using Supabase subscriptions with PostgreSQL change streams for instant message delivery and live updates across conversations.

## Key Features

### Intelligent Matching Algorithm

- **Interest-Based Scoring**: Users are matched based on shared category interests
- **Smart Filtering**: Excludes blocked users and previously liked profiles
- **Deprioritization**: Left-swiped profiles are moved to bottom of queue
- **Geographic Proximity**: Distance-based matching for local friendships (with privacy controls)

### Real-Time Messaging

- **Instant Delivery**: Messages delivered in real-time using Supabase subscriptions
- **Read Receipts**: Tracks message read status across conversations
- **Unread Counts**: Efficient unread message counting per conversation
- **Thread Management**: Organized conversation threading

### Safety & Moderation

- **User Blocking**: Comprehensive blocking system with bidirectional filtering
- **Reporting System**: Multiple report categories (harassment, spam, inappropriate content)
- **Content Moderation**: Built-in safety mechanisms for user protection
- **Privacy Controls**: Secure data handling and user privacy protection

### User Experience

- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Gesture-Based UI**: Intuitive swipe gestures for browsing potential friends
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Dark Theme**: Modern dark UI with glass morphism effects

## Technical Implementation

### Database Design

- **Normalized Schema**: Efficient relational database design
- **Row Level Security**: Supabase RLS policies for data protection
- **Optimized Queries**: Efficient data fetching with proper indexing
- **Real-time Triggers**: Database triggers for automated processes

### Performance Optimizations

- **Lazy Loading**: Components loaded on-demand
- **Image Optimization**: Efficient photo handling and caching
- **Query Optimization**: Minimized database calls with strategic caching
- **Memory Management**: Proper cleanup of subscriptions and listeners

### Security Measures

- **Authentication**: Secure JWT-based authentication
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against abuse and spam

## Mobile-First Design

The app is built with mobile-first principles:

- **Cross-Platform**: Single codebase for iOS and Android
- **Native Performance**: Optimized for mobile devices
- **Offline Support**: Graceful handling of network connectivity
- **Push Notifications**: Real-time notification system (ready for implementation)

## UI/UX Excellence

- **Modern Design System**: Consistent design language throughout
- **Accessibility**: WCAG compliant interface design
- **Micro-interactions**: Delightful user experience details
- **Loading States**: Thoughtful loading and error states
- **Error Handling**: Comprehensive error management and user feedback

