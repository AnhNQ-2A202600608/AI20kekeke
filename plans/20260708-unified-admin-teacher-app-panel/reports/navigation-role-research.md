# Research Note: Role Navigation Rail

Timestamp: 2026-07-08

## Problem

The current floating pill mixes two jobs:

- switching persona/workspace: student, mentor, BTC/admin
- navigating destinations inside the selected persona

That creates duplicate person icons, repeated active states, and a rail that grows unpredictably when the user switches from student to mentor or BTC.

## External Guidance

- Material Design navigation rail guidance treats the rail as access to top-level destinations and recommends a small destination count for side navigation.
- Android navigation rail guidance describes rails as suitable for top-level destinations that must be available anywhere, commonly three to seven destinations.
- NN/g warns that audience/role navigation only works when content is truly unique to each audience and can hurt usability when users belong to multiple groups.

## Recommendation

Use one rail with two separate zones:

1. Persona switcher zone at the top.
   - Shows the current persona as the primary green bubble.
   - Tap expands only the persona choices vertically inside the same pill.
   - Choosing a persona collapses the switcher and changes the destination list.

2. Destination zone below it.
   - Shows only destinations for the selected persona.
   - Do not also show teacher/admin groups as nested dropdowns.
   - Active destination has the green state.

## Target Behavior

- Admin/dev can switch between Học viên, Giảng viên, and BTC/Admin from the top of the rail.
- After switching to Giảng viên, the rail shows only mentor destinations: Thống kê lớp, Tài liệu & Graph, Quản lý quiz, Mentor Review, Trợ lý AI, Cá nhân.
- After switching to BTC/Admin, the rail shows only BTC/admin destinations: AI Observability, Cổng BTC, Trợ lý AI, Cá nhân.
- Student role remains simple and does not see the persona switcher.

## Performance Decision

The rail stores only labels, icons, persona ids, and tab ids. It must not import or render mentor/admin page components. Heavy content remains behind the existing dynamic imports in `DashboardLayout`.

## Implementation Direction

- Removed `FloatingRoleGroups`, `FloatingRoleGroup`, and nested action expansion.
- Added a compact persona switcher inside `LeftBar` for accounts with more than one persona.
- Kept `items = getNavigationItems(selectedPersona, role)` as the only destination source.
- On persona switch:
  - set selected persona
  - navigate to the default tab for that persona
  - collapse the switcher

## Sources

- Material Design 3 navigation rail: https://m3.material.io/components/navigation-rail/overview
- Android Developers navigation rail: https://developer.android.com/develop/ui/compose/components/navigation-rail
- NN/g audience-based navigation: https://www.nngroup.com/articles/audience-based-navigation/
