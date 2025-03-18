# Implementation Plan

## 1. Initial Setup
- [ ] Create Next.js app with TypeScript and Tailwind
- [ ] Setup Nix flake and direnv
- [ ] Configure environment variables

## 2. Core Infrastructure
- [ ] Create API client with auth flow
- [ ] Setup TypeScript interfaces
- [ ] Create base layout and navigation

## 3. User Management Feature
- [ ] Implement user listing
- [ ] Add user creation functionality
- [ ] Display user details view

## 4. Standards Launch Feature
- [ ] Create standard set selection
- [ ] Implement standard selection within set
- [ ] Build launch flow
- [ ] Generate student launch links

## 5. Polish & Refinements
- [ ] Add error handling
- [ ] Implement loading states
- [ ] Add basic styling

## Notes
- Auth flow is 2-legged, server-only
- Teacher creation is idempotent
- Student links don't need tracking
- Standards launch is one standard per launch 