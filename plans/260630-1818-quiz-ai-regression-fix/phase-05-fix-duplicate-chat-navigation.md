---
phase: 5
title: Fix Duplicate Chat Navigation
status: completed
priority: P2
dependencies:
  - 1
---

# Phase 5: Fix Duplicate Chat Navigation

## Overview

Remove the duplicate hamburger/expand control on the Socratic chat screen while preserving desktop collapsed sidebar and mobile drawer behavior.

## Requirements

- Functional: desktop collapsed chat sidebar has one obvious expand control.
- Functional: mobile chat keeps a menu button to open the drawer.
- Non-functional: no regression to global dashboard navigation.

## Architecture

`DashboardLayout` hides `LeftBar` desktop sidebar on chat, so the duplicate is within the chat module itself: `ChatSidebar` collapsed aside plus `SocraticChatTab` header collapsed expand button.

## Related Code Files

- Modify: `frontend/components/dashboard/socratic-chat/index.tsx`
- Modify if needed: `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`
- Inspect: `frontend/app/components/dashboard-layout.tsx`
- Inspect: `frontend/components/LeftBar.tsx`

## Implementation Steps

1. Keep the mobile-only menu at `SocraticChatTab` header for `md:hidden`.
2. Remove or hide the desktop `isSidebarCollapsed` expand button in the header.
3. Keep the collapsed `ChatSidebar` expand button, or choose the header button as the only desktop control.
4. Verify expanded and collapsed states at desktop width.
5. Verify mobile drawer opens/closes and has navigation/history.

## Success Criteria

- [ ] Desktop collapsed chat shows one menu/expand icon, not two adjacent icons.
- [ ] Mobile chat still has a menu button.
- [ ] Navigation items still switch tabs.
- [ ] History popover still works.

## Risk Assessment

Small UI risk. Avoid changing `LeftBar` unless testing proves it contributes to the duplicate in the target viewport.
